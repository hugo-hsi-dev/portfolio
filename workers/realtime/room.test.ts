import { env, exports } from 'cloudflare:workers';
import { runInDurableObject } from 'cloudflare:test';
import { afterEach, describe, expect, it } from 'vitest';

import { DEFAULT_FRAME_POSITIONS } from '@portfolio/realtime-contract';

import {
	ALLOWED_ORIGIN,
	RESET_TOKEN,
	VISITOR_A,
	VISITOR_B,
	closeOpenSockets,
	collectMessages,
	connect,
	connectLegacy,
	nextLegacyMessage,
	nextMessage
} from './test-helpers';

afterEach(closeOpenSockets);

describe('PortfolioRoom collaboration', () => {
	it('negotiates v2 explicitly while preserving the original strict wire by default', async () => {
		const legacy = await connectLegacy(VISITOR_A);
		expect(legacy.snapshot.frames[0]).not.toHaveProperty('visible');
		expect(legacy.snapshot.frames[0]).not.toHaveProperty('locked');

		const legacyJoin = nextLegacyMessage(legacy.socket, (message) => message.type === 'peer.join');
		const current = await connect(VISITOR_B);
		const joined = await legacyJoin;
		expect(joined.type === 'peer.join' && joined.peer).not.toHaveProperty('view');
		expect(current.snapshot.peers[0]).toMatchObject({ visitorId: VISITOR_A, view: null });

		const legacyFrameUpdate = nextLegacyMessage(
			legacy.socket,
			(message) => message.type === 'frame.update'
		);
		current.socket.send(
			JSON.stringify({
				type: 'frame.metadata',
				seq: 1,
				frameId: 'profile',
				visible: false,
				locked: true
			})
		);
		const downleveledFrame = await legacyFrameUpdate;
		expect(downleveledFrame.type === 'frame.update' && downleveledFrame.frame).not.toHaveProperty(
			'visible'
		);
		expect(downleveledFrame.type === 'frame.update' && downleveledFrame.frame).not.toHaveProperty(
			'locked'
		);

		const legacyPeerUpdate = nextLegacyMessage(
			legacy.socket,
			(message) => message.type === 'peer.update'
		);
		current.socket.send(
			JSON.stringify({
				type: 'presence.update',
				seq: 2,
				cursor: { x: 40, y: 80 },
				selectedFrameId: 'profile',
				view: { center: { x: 200, y: 300 }, zoom: 1.5 }
			})
		);
		expect(await legacyPeerUpdate).not.toHaveProperty('view');

		const laterLegacy = await connectLegacy('d71ac75c-08cc-427d-bdc8-eaca7f7a70f7');
		expect(laterLegacy.snapshot.peers.every((peer) => !('view' in peer))).toBe(true);
		expect(laterLegacy.snapshot.frames.every((frame) => !('visible' in frame))).toBe(true);

		const normalizedLegacyPresence = nextMessage(
			current.socket,
			(message) => message.type === 'peer.update'
		);
		legacy.socket.send(
			JSON.stringify({
				type: 'presence.update',
				seq: 1,
				cursor: { x: 5, y: 10 },
				selectedFrameId: null
			})
		);
		const legacyPresence = await normalizedLegacyPresence;
		expect(legacyPresence.type === 'peer.update' && legacyPresence.view).toBeNull();

		const strictV2Error = nextMessage(
			current.socket,
			(message) => message.type === 'error' && message.code === 'invalid-message'
		);
		current.socket.send(
			JSON.stringify({
				type: 'presence.update',
				seq: 3,
				cursor: null,
				selectedFrameId: null
			})
		);
		expect((await strictV2Error).type).toBe('error');

		const legacyLockedError = nextLegacyMessage(
			legacy.socket,
			(message) => message.type === 'error'
		);
		legacy.socket.send(
			JSON.stringify({
				type: 'frame.move',
				seq: 2,
				frameId: 'profile',
				x: 500,
				y: 600,
				final: true
			})
		);
		const lockedError = await legacyLockedError;
		expect(lockedError.type === 'error' && lockedError.code).toBe('server-error');

		const restored = nextLegacyMessage(legacy.socket, (message) => message.type === 'frame.update');
		current.socket.send(
			JSON.stringify({
				type: 'frame.metadata',
				seq: 3,
				frameId: 'profile',
				visible: true,
				locked: false
			})
		);
		await restored;
	});

	it('rejects unsupported explicitly requested protocol versions', async () => {
		const response = await exports.default.fetch(
			new Request(`http://realtime.test/ws?visitorId=${VISITOR_A}&protocol=99`, {
				headers: { Upgrade: 'websocket', Origin: ALLOWED_ORIGIN }
			})
		);
		expect(response.status).toBe(400);
		expect(await response.text()).toBe('Unsupported realtime protocol');
	});

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
				selectedFrameId: 'profile',
				view: { center: { x: 320, y: 240 }, zoom: 1.25 }
			})
		);
		const presence = await presencePromise;
		expect(presence.type === 'peer.update' && presence.cursor).toEqual({ x: 40, y: 80 });
		expect(presence.type === 'peer.update' && presence.view).toEqual({
			center: { x: 320, y: 240 },
			zoom: 1.25
		});

		const third = await connect('d71ac75c-08cc-427d-bdc8-eaca7f7a70f7');
		expect(third.snapshot.peers.find((peer) => peer.visitorId === VISITOR_A)?.view).toEqual({
			center: { x: 320, y: 240 },
			zoom: 1.25
		});
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

	it('applies the shared message-size limit before metadata validation', async () => {
		const room = env.PORTFOLIO_ROOMS.getByName('public');
		const initialRevision = (await room.getBoardState()).revision;
		const first = await connect(VISITOR_A);
		const rejected = nextMessage(
			first.socket,
			(message) => message.type === 'error' && message.code === 'message-too-large'
		);
		first.socket.send(
			JSON.stringify({
				type: 'frame.metadata',
				seq: 1,
				frameId: 'profile',
				locked: true,
				padding: 'x'.repeat(2_048)
			})
		);
		expect((await rejected).type).toBe('error');
		expect((await room.getBoardState()).revision).toBe(initialRevision);
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

	it('broadcasts and persists authoritative visibility and locking metadata', async () => {
		const room = env.PORTFOLIO_ROOMS.getByName('public');
		const initialRevision = (await room.getBoardState()).revision;
		const first = await connect(VISITOR_A);
		const second = await connect(VISITOR_B);
		const updates = collectMessages(second.socket, 2, (message) => message.type === 'frame.update');

		first.socket.send(
			JSON.stringify({
				type: 'frame.metadata',
				seq: 1,
				frameId: 'profile',
				visible: false
			})
		);
		first.socket.send(
			JSON.stringify({
				type: 'frame.metadata',
				seq: 2,
				frameId: 'profile',
				locked: true
			})
		);

		const [hidden, locked] = (await updates).filter((message) => message.type === 'frame.update');
		expect(hidden.frame).toMatchObject({ visible: false, locked: false });
		expect(locked.frame).toMatchObject({ visible: false, locked: true });
		expect(locked.frame.revision).toBe(initialRevision + 2);

		const reconnected = await connect(VISITOR_A);
		expect(reconnected.snapshot.frames.find((frame) => frame.id === 'profile')).toMatchObject({
			visible: false,
			locked: true,
			revision: initialRevision + 2
		});
	});

	it('rejects locked moves without mutating persistence or consuming sequence', async () => {
		const room = env.PORTFOLIO_ROOMS.getByName('public');
		const initial = await room.getBoardState();
		const original = initial.frames.find((frame) => frame.id === 'profile');
		const first = await connect(VISITOR_A);

		const lock = nextMessage(first.socket, (message) => message.type === 'frame.update');
		first.socket.send(
			JSON.stringify({
				type: 'frame.metadata',
				seq: 1,
				frameId: 'profile',
				locked: true
			})
		);
		await lock;

		const rejected = nextMessage(
			first.socket,
			(message) => message.type === 'error' && message.code === 'frame-locked'
		);
		first.socket.send(
			JSON.stringify({
				type: 'frame.move',
				seq: 2,
				frameId: 'profile',
				x: 999,
				y: 888,
				final: true
			})
		);
		expect((await rejected).type).toBe('error');
		expect(
			(await room.getBoardState()).frames.find((frame) => frame.id === 'profile')
		).toMatchObject({
			x: original?.x,
			y: original?.y,
			revision: initial.revision + 1,
			locked: true
		});

		const unlock = nextMessage(
			first.socket,
			(message) => message.type === 'frame.update' && message.clientSeq === 2
		);
		first.socket.send(
			JSON.stringify({
				type: 'frame.metadata',
				seq: 2,
				frameId: 'profile',
				locked: false
			})
		);
		const unlocked = await unlock;
		expect(unlocked.type === 'frame.update' && unlocked.frame.locked).toBe(false);
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
		const metadata = nextMessage(first.socket, (message) => message.type === 'frame.update');
		first.socket.send(
			JSON.stringify({
				type: 'frame.metadata',
				seq: 2,
				frameId: 'profile',
				visible: false,
				locked: true
			})
		);
		await metadata;

		const resetResponse = await exports.default.fetch(
			new Request('http://realtime.test/reset', {
				method: 'POST',
				headers: { 'x-board-reset-token': RESET_TOKEN }
			})
		);
		expect(resetResponse.status).toBe(200);
		const reset = await room.getBoardState();
		expect(reset.revision).toBe(initialRevision + 3);
		expect(reset.frames.map(({ id, x, y }) => ({ id, x, y }))).toEqual(DEFAULT_FRAME_POSITIONS);
		expect(reset.frames.every((frame) => frame.visible && !frame.locked)).toBe(true);
	});
});
