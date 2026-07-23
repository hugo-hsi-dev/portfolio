import { env } from 'cloudflare:workers';
import { afterEach, describe, expect, it } from 'vitest';

import { RATE_LIMIT_CLOSE_CODE } from './constants';
import { VISITOR_A, closeOpenSockets, connect, nextClose, nextMessage } from './test-helpers';

afterEach(closeOpenSockets);

describe('PortfolioRoom rate limiting', () => {
	it('sends one policy error, closes with 1008, and ignores queued updates', async () => {
		const room = env.PORTFOLIO_ROOMS.getByName('public');
		const { socket } = await connect(VISITOR_A);
		const errors: string[] = [];
		socket.addEventListener('message', (event) => {
			const text = String(event.data);
			if (text.includes('"code":"rate-limited"')) errors.push(text);
		});
		const rateLimited = nextMessage(
			socket,
			(message) => message.type === 'error' && message.code === 'rate-limited'
		);
		const closed = nextClose(socket);

		for (let seq = 1; seq <= 61; seq += 1) {
			socket.send(
				JSON.stringify({
					type: 'presence.update',
					seq,
					cursor: null,
					selectedFrameId: null
				})
			);
		}
		socket.send(
			JSON.stringify({
				type: 'frame.move',
				seq: 62,
				frameId: 'profile',
				x: 900,
				y: 900,
				final: true
			})
		);

		const error = await rateLimited;
		expect(error.type === 'error' && error.code).toBe('rate-limited');
		expect((await closed).code).toBe(RATE_LIMIT_CLOSE_CODE);
		expect(errors).toHaveLength(1);

		const board = await room.getBoardState();
		expect(board.revision).toBe(0);
	});
});
