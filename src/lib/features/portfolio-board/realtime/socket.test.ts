import { afterEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_FRAME_POSITIONS, type RoomSnapshot } from '@portfolio/realtime-contract';

import { BoardSocketController, createBoardWebSocketUrl, isTerminalWebSocketClose } from './socket';

class FakeWebSocket {
	static readonly OPEN = 1;
	static readonly CLOSING = 2;
	static readonly CLOSED = 3;
	static readonly instances: FakeWebSocket[] = [];

	readonly url: string;
	readyState = 0;
	throwOnSend = false;
	readonly sent: string[] = [];
	readonly #messageListeners = new Set<(event: MessageEvent<string>) => void>();
	readonly #closeListeners = new Set<(event: CloseEvent) => void>();
	readonly #errorListeners = new Set<() => void>();

	constructor(url: string) {
		this.url = url;
		FakeWebSocket.instances.push(this);
	}

	addEventListener(type: 'message', listener: (event: MessageEvent<string>) => void): void;
	addEventListener(type: 'close', listener: (event: CloseEvent) => void): void;
	addEventListener(type: 'error', listener: () => void): void;
	addEventListener(
		type: 'message' | 'close' | 'error',
		listener: ((event: MessageEvent<string>) => void) | ((event: CloseEvent) => void) | (() => void)
	): void {
		if (type === 'message') {
			this.#messageListeners.add(listener as (event: MessageEvent<string>) => void);
		} else if (type === 'close') {
			this.#closeListeners.add(listener as (event: CloseEvent) => void);
		} else {
			this.#errorListeners.add(listener as () => void);
		}
	}

	send(data: string): void {
		if (this.throwOnSend) throw new DOMException('Socket closed', 'InvalidStateError');
		this.sent.push(data);
	}

	close(code = 1006, reason = ''): void {
		if (this.readyState >= 2) return;
		this.readyState = 3;
		const event = new CloseEvent('close', { code, reason });
		for (const listener of this.#closeListeners) listener(event);
	}

	emitSnapshot(): void {
		this.readyState = FakeWebSocket.OPEN;
		this.emitRaw(JSON.stringify(createSnapshot()));
	}

	emitRaw(data: string): void {
		const event = new MessageEvent('message', { data });
		for (const listener of this.#messageListeners) listener(event);
	}
}

class FakeNetworkEvents {
	readonly #listeners = {
		online: new Set<() => void>(),
		offline: new Set<() => void>()
	};

	addEventListener(type: 'online' | 'offline', listener: () => void): void {
		this.#listeners[type].add(listener);
	}

	removeEventListener(type: 'online' | 'offline', listener: () => void): void {
		this.#listeners[type].delete(listener);
	}

	emit(type: 'online' | 'offline'): void {
		for (const listener of this.#listeners[type]) listener();
	}
}

class FakeVisibilityEvents {
	readonly #listeners = new Set<() => void>();

	addEventListener(_type: 'visibilitychange', listener: () => void): void {
		this.#listeners.add(listener);
	}

	removeEventListener(_type: 'visibilitychange', listener: () => void): void {
		this.#listeners.delete(listener);
	}

	emit(): void {
		for (const listener of this.#listeners) listener();
	}
}

function createSnapshot(): RoomSnapshot {
	return {
		type: 'room.snapshot',
		revision: 0,
		frames: DEFAULT_FRAME_POSITIONS.map((frame) => ({
			...frame,
			revision: 0,
			updatedAt: 0,
			updatedBy: null
		})),
		self: {
			sessionId: 'adf73f2f-f2d3-4246-9087-84a46bf665bd',
			visitorId: '2ac3308f-a622-4b9b-9782-981d19ef943c',
			name: 'Guest 1234',
			color: '#0acf83'
		},
		peers: []
	};
}

afterEach(() => {
	vi.useRealTimers();
	FakeWebSocket.instances.length = 0;
});

describe('BoardSocketController', () => {
	it('does not buffer and only opens after a valid snapshot', () => {
		const initialConnectionOrder: string[] = [];
		const controller = new BoardSocketController({
			url: 'ws://example.test/ws',
			WebSocketImpl: FakeWebSocket,
			isOnline: () => true
		});
		controller.onMessage(() => initialConnectionOrder.push('snapshot-applied'));
		controller.onStateChange((state) => {
			if (state === 'open') initialConnectionOrder.push('open');
		});
		controller.connect();
		controller.connect();
		expect(FakeWebSocket.instances).toHaveLength(1);
		expect(controller.state).toBe('connecting');
		expect(
			controller.send({ type: 'presence.update', seq: 1, cursor: null, selectedFrameId: null })
		).toBe(false);

		FakeWebSocket.instances[0].emitSnapshot();
		expect(controller.state).toBe('open');
		expect(initialConnectionOrder).toEqual(['snapshot-applied', 'open']);
		expect(
			controller.send({ type: 'presence.update', seq: 1, cursor: null, selectedFrameId: null })
		).toBe(true);
		expect(FakeWebSocket.instances[0].sent).toHaveLength(1);
		FakeWebSocket.instances[0].throwOnSend = true;
		expect(
			controller.send({ type: 'presence.update', seq: 2, cursor: null, selectedFrameId: null })
		).toBe(false);
		controller.close();
		expect(controller.state).toBe('closed');
	});

	it('reconnects abnormal closures with capped full jitter', async () => {
		vi.useFakeTimers();
		const controller = new BoardSocketController({
			url: 'ws://example.test/ws',
			WebSocketImpl: FakeWebSocket,
			isOnline: () => true,
			baseReconnectDelayMs: 100,
			maxReconnectDelayMs: 150,
			random: () => 0.5
		});
		controller.connect();
		FakeWebSocket.instances[0].emitSnapshot();
		FakeWebSocket.instances[0].close();
		expect(controller.state).toBe('reconnecting');
		await vi.advanceTimersByTimeAsync(49);
		expect(FakeWebSocket.instances).toHaveLength(1);
		await vi.advanceTimersByTimeAsync(1);
		expect(FakeWebSocket.instances).toHaveLength(2);
		FakeWebSocket.instances[1].close();
		await vi.advanceTimersByTimeAsync(74);
		expect(FakeWebSocket.instances).toHaveLength(2);
		await vi.advanceTimersByTimeAsync(1);
		expect(FakeWebSocket.instances).toHaveLength(3);
		controller.close();
	});

	it('ignores messages from a superseded socket generation', () => {
		const networkEvents = new FakeNetworkEvents();
		const controller = new BoardSocketController({
			url: 'ws://example.test/ws',
			WebSocketImpl: FakeWebSocket,
			networkEvents,
			isOnline: () => true
		});
		controller.connect();
		const first = FakeWebSocket.instances[0];
		networkEvents.emit('online');
		expect(FakeWebSocket.instances).toHaveLength(2);
		first.emitSnapshot();
		expect(controller.state).toBe('reconnecting');
		FakeWebSocket.instances[1].emitSnapshot();
		expect(controller.state).toBe('open');
		controller.close();
	});

	it('rejects a non-snapshot as the first server message', () => {
		const controller = new BoardSocketController({
			url: 'ws://example.test/ws',
			WebSocketImpl: FakeWebSocket,
			isOnline: () => true
		});
		controller.connect();
		const socket = FakeWebSocket.instances[0];
		socket.readyState = FakeWebSocket.OPEN;
		socket.emitRaw(
			JSON.stringify({
				type: 'peer.leave',
				sessionId: 'adf73f2f-f2d3-4246-9087-84a46bf665bd'
			})
		);
		expect(socket.readyState).toBe(FakeWebSocket.CLOSED);
		expect(controller.state).toBe('failed');
		controller.close();
	});

	it.each([1002, 1008])(
		'enters a terminal failed state for protocol or policy closure %i',
		async (code) => {
			vi.useFakeTimers();
			const networkEvents = new FakeNetworkEvents();
			const controller = new BoardSocketController({
				url: 'ws://example.test/ws',
				WebSocketImpl: FakeWebSocket,
				networkEvents,
				isOnline: () => true,
				baseReconnectDelayMs: 10
			});
			controller.connect();
			const socket = FakeWebSocket.instances[0];
			socket.emitSnapshot();
			socket.close(code, 'Terminal');
			expect(controller.state).toBe('failed');
			await vi.advanceTimersByTimeAsync(1_000);
			networkEvents.emit('online');
			expect(FakeWebSocket.instances).toHaveLength(1);
			controller.close();
		}
	);

	it('recovers immediately when the browser comes online and stops after disposal', () => {
		const networkEvents = new FakeNetworkEvents();
		let online = false;
		const controller = new BoardSocketController({
			url: 'ws://example.test/ws',
			WebSocketImpl: FakeWebSocket,
			networkEvents,
			isOnline: () => online
		});
		controller.connect();
		expect(controller.state).toBe('offline');
		expect(FakeWebSocket.instances).toHaveLength(0);

		online = true;
		networkEvents.emit('online');
		expect(FakeWebSocket.instances).toHaveLength(1);
		controller.close();
		networkEvents.emit('online');
		expect(FakeWebSocket.instances).toHaveLength(1);
	});

	it('rechecks a reconnecting socket when the page becomes visible', () => {
		const visibilityEvents = new FakeVisibilityEvents();
		let visible = false;
		const controller = new BoardSocketController({
			url: 'ws://example.test/ws',
			WebSocketImpl: FakeWebSocket,
			visibilityEvents,
			isOnline: () => true,
			isVisible: () => visible,
			baseReconnectDelayMs: 10_000
		});
		controller.connect();
		FakeWebSocket.instances[0].emitSnapshot();
		FakeWebSocket.instances[0].close();
		visible = true;
		visibilityEvents.emit();
		expect(FakeWebSocket.instances).toHaveLength(2);
		controller.close();
	});

	it('times out a connection that never supplies its initial snapshot', async () => {
		vi.useFakeTimers();
		const controller = new BoardSocketController({
			url: 'ws://example.test/ws',
			WebSocketImpl: FakeWebSocket,
			isOnline: () => true,
			connectionTimeoutMs: 500,
			baseReconnectDelayMs: 100,
			random: () => 1
		});
		controller.connect();
		await vi.advanceTimersByTimeAsync(500);
		expect(FakeWebSocket.instances[0].readyState).toBe(FakeWebSocket.CLOSED);
		expect(controller.state).toBe('reconnecting');
		await vi.advanceTimersByTimeAsync(100);
		expect(FakeWebSocket.instances).toHaveLength(2);
		controller.close();
	});

	it('builds direct-development and same-origin production URLs', () => {
		const visitorId = '2ac3308f-a622-4b9b-9782-981d19ef943c';
		expect(createBoardWebSocketUrl(visitorId, { dev: true })).toBe(
			`ws://127.0.0.1:8788/ws?visitorId=${visitorId}`
		);
		expect(
			createBoardWebSocketUrl(visitorId, {
				dev: false,
				location: { protocol: 'https:', host: 'www.hugohsi.dev' }
			})
		).toBe(`wss://www.hugohsi.dev/api/board/ws?visitorId=${visitorId}`);
	});

	it('classifies only protocol and policy violations as terminal', () => {
		expect(isTerminalWebSocketClose(1002)).toBe(true);
		expect(isTerminalWebSocketClose(1008)).toBe(true);
		expect(isTerminalWebSocketClose(1006)).toBe(false);
		expect(isTerminalWebSocketClose(1011)).toBe(false);
	});
});
