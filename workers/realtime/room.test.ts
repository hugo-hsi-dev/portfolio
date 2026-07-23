import { env, exports } from 'cloudflare:workers';
import { runInDurableObject } from 'cloudflare:test';
import { afterEach, describe, expect, it } from 'vitest';

import { DEFAULT_FRAME_POSITIONS } from '@portfolio/realtime-contract';

import {
	RESET_TOKEN,
	VISITOR_A,
	VISITOR_B,
	closeOpenSockets,
	collectMessages,
	connect,
	nextMessage
} from './test-helpers';

afterEach(closeOpenSockets);

describe('PortfolioRoom collaboration', () => {
	it('coordinates presence and peer snapshots', async () => {
		const first = await connect(VISITOR_A);
		const joinPromise = nextMessage(first.socket, (message) => message.type === 'peer.join');
		const second = await connect(VISITOR_B);
		const joined = await joinPromise;
		expect(joined.type === 'peer.join' && joined.peer.visitorId).toBe(VISITOR_B);
		expect(second.snapshot.peers).toHaveLength(1);

		const presencePromise = nextMessage(second.socket, (message) => message.type === 'peer.update');
		first.socket.send(
			JSON.stringify({
				type: 'presence.update',
				seq: 1,
				cursor: { x: 40, y: 80 },
				selectedFrameId: 'profile'
			})
		);
		const presence = await presencePromise;
		expect(presence.type === 'peer.update' && presence.cursor).toEqual({ x: 40, y: 80 });
	});

	it('validates messages and reports storage failures without advancing sequence', async () => {
		const room = env.PORTFOLIO_ROOMS.getByName('public');
		const first = await connect(VISITOR_A);

		const malformedPromise = nextMessage(
			first.socket,
			(message) => message.type === 'error' && message.code === 'invalid-message'
		);
		first.socket.send('{');
		expect((await malformedPromise).type).toBe('error');

		await runInDurableObject(room, (_instance, state) => {
			state.storage.sql.exec(`
				CREATE TRIGGER fail_profile_update
				BEFORE UPDATE ON frames
				WHEN NEW.frame_id = 'profile' AND NEW.x = 666
				BEGIN
					SELECT RAISE(ABORT, 'forced frame update failure');
				END;
			`);
		});
		const failedMovePromise = nextMessage(
			first.socket,
			(message) => message.type === 'error' && message.code === 'server-error'
		);
		first.socket.send(
			JSON.stringify({
				type: 'frame.move',
				seq: 1,
				frameId: 'profile',
				x: 666,
				y: 654,
				final: true
			})
		);
		expect((await failedMovePromise).type).toBe('error');
		await runInDurableObject(room, (_instance, state) => {
			state.storage.sql.exec('DROP TRIGGER fail_profile_update');
		});

		const recovered = nextMessage(first.socket, (message) => message.type === 'frame.update');
		first.socket.send(
			JSON.stringify({
				type: 'frame.move',
				seq: 1,
				frameId: 'profile',
				x: 321,
				y: 654,
				final: true
			})
		);
		expect((await recovered).type).toBe('frame.update');
	});

	it('persists last-write-wins moves across reconnects', async () => {
		const room = env.PORTFOLIO_ROOMS.getByName('public');
		const initialRevision = (await room.getBoardState()).revision;
		const first = await connect(VISITOR_A);
		const second = await connect(VISITOR_B);
		const concurrentUpdates = collectMessages(
			first.socket,
			2,
			(message) => message.type === 'frame.update'
		);

		first.socket.send(
			JSON.stringify({
				type: 'frame.move',
				seq: 1,
				frameId: 'profile',
				x: 321,
				y: 654,
				final: true
			})
		);
		second.socket.send(
			JSON.stringify({
				type: 'frame.move',
				seq: 1,
				frameId: 'profile',
				x: 987,
				y: 123,
				final: true
			})
		);
		const moves = (await concurrentUpdates)
			.filter((message) => message.type === 'frame.update')
			.sort((a, b) => a.frame.revision - b.frame.revision);
		expect(moves.map((move) => move.frame.revision)).toEqual([
			initialRevision + 1,
			initialRevision + 2
		]);

		const winner = moves[1].frame;
		const moved = await room.getBoardState();
		expect(moved.frames.find((frame) => frame.id === 'profile')).toMatchObject(winner);

		first.socket.close(1000, 'Reconnect test');
		const reconnected = await connect(VISITOR_A);
		expect(reconnected.snapshot.revision).toBe(initialRevision + 2);
		expect(reconnected.snapshot.frames.find((frame) => frame.id === 'profile')).toMatchObject({
			x: winner.x,
			y: winner.y
		});
	});

	it('authenticates resets and restores every initial position', async () => {
		const room = env.PORTFOLIO_ROOMS.getByName('public');
		const initialRevision = (await room.getBoardState()).revision;
		const first = await connect(VISITOR_A);
		const update = nextMessage(first.socket, (message) => message.type === 'frame.update');
		first.socket.send(
			JSON.stringify({
				type: 'frame.move',
				seq: 1,
				frameId: 'profile',
				x: 250,
				y: 300,
				final: true
			})
		);
		await update;

		const resetResponse = await exports.default.fetch(
			new Request('http://realtime.test/reset', {
				method: 'POST',
				headers: { 'x-board-reset-token': RESET_TOKEN }
			})
		);
		expect(resetResponse.status).toBe(200);
		const reset = await room.getBoardState();
		expect(reset.revision).toBe(initialRevision + 2);
		expect(reset.frames.map(({ id, x, y }) => ({ id, x, y }))).toEqual(DEFAULT_FRAME_POSITIONS);
	});
});
