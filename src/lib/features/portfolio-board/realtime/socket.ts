import {
	clientMessageSchema,
	serverMessageSchema,
	type ClientMessage,
	type ServerMessage
} from '@portfolio/realtime-contract';

export type ConnectionState =
	'idle' | 'connecting' | 'open' | 'reconnecting' | 'offline' | 'failed' | 'closed';

type MessageListener = (message: ServerMessage) => void;
type StateListener = (state: ConnectionState) => void;

interface WebSocketLike {
	readonly readyState: number;
	send(data: string): void;
	close(code?: number, reason?: string): void;
	addEventListener(type: 'message', listener: (event: MessageEvent<string>) => void): void;
	addEventListener(type: 'close', listener: (event: CloseEvent) => void): void;
	addEventListener(type: 'error', listener: () => void): void;
}

interface WebSocketConstructor {
	new (url: string): WebSocketLike;
	readonly OPEN: number;
	readonly CLOSING: number;
	readonly CLOSED: number;
}

interface NetworkEvents {
	addEventListener(type: 'online' | 'offline', listener: () => void): void;
	removeEventListener(type: 'online' | 'offline', listener: () => void): void;
}

interface VisibilityEvents {
	addEventListener(type: 'visibilitychange', listener: () => void): void;
	removeEventListener(type: 'visibilitychange', listener: () => void): void;
}

export interface BoardSocketOptions {
	url: string | (() => string);
	WebSocketImpl?: WebSocketConstructor;
	networkEvents?: NetworkEvents;
	visibilityEvents?: VisibilityEvents;
	isOnline?: () => boolean;
	isVisible?: () => boolean;
	connectionTimeoutMs?: number;
	baseReconnectDelayMs?: number;
	maxReconnectDelayMs?: number;
	random?: () => number;
}

export interface BoardWebSocketUrlOptions {
	dev?: boolean;
	location?: Pick<Location, 'protocol' | 'host'>;
	devHost?: string;
}

export function isTerminalWebSocketClose(code: number): boolean {
	return code === 1002 || code === 1008;
}

export function createBoardWebSocketUrl(
	visitorId: string,
	options: BoardWebSocketUrlOptions = {}
): string {
	const dev = options.dev ?? import.meta.env.DEV;
	const location = options.location ?? globalThis.location;
	const base = dev
		? `ws://${options.devHost ?? '127.0.0.1:8788'}/ws`
		: `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/api/board/ws`;
	const url = new URL(base);
	url.searchParams.set('visitorId', visitorId);
	return url.toString();
}

export class BoardSocketController {
	readonly #url: string | (() => string);
	readonly #WebSocketImpl: WebSocketConstructor;
	readonly #networkEvents?: NetworkEvents;
	readonly #visibilityEvents?: VisibilityEvents;
	readonly #isOnline: () => boolean;
	readonly #isVisible: () => boolean;
	readonly #connectionTimeoutMs: number;
	readonly #baseReconnectDelayMs: number;
	readonly #maxReconnectDelayMs: number;
	readonly #random: () => number;
	readonly #messageListeners = new Set<MessageListener>();
	readonly #stateListeners = new Set<StateListener>();

	#state: ConnectionState = 'idle';
	#socket: WebSocketLike | null = null;
	#reconnectTimer: ReturnType<typeof setTimeout> | null = null;
	#connectionTimer: ReturnType<typeof setTimeout> | null = null;
	#generation = 0;
	#attempt = 0;
	#started = false;
	#intentionallyClosed = false;
	#awaitingSnapshot = true;

	constructor(options: BoardSocketOptions) {
		this.#url = options.url;
		this.#WebSocketImpl = options.WebSocketImpl ?? globalThis.WebSocket;
		this.#networkEvents = options.networkEvents ?? (globalThis.window as NetworkEvents | undefined);
		this.#visibilityEvents =
			options.visibilityEvents ?? (globalThis.document as VisibilityEvents | undefined);
		this.#isOnline = options.isOnline ?? (() => globalThis.navigator?.onLine !== false);
		this.#isVisible =
			options.isVisible ?? (() => globalThis.document?.visibilityState !== 'hidden');
		this.#connectionTimeoutMs = options.connectionTimeoutMs ?? 8_000;
		this.#baseReconnectDelayMs = options.baseReconnectDelayMs ?? 500;
		this.#maxReconnectDelayMs = options.maxReconnectDelayMs ?? 15_000;
		this.#random = options.random ?? Math.random;
	}

	get state(): ConnectionState {
		return this.#state;
	}

	connect(): void {
		if (this.#intentionallyClosed) return;
		if (!this.#started) {
			this.#started = true;
			this.#networkEvents?.addEventListener('online', this.#handleOnline);
			this.#networkEvents?.addEventListener('offline', this.#handleOffline);
			this.#visibilityEvents?.addEventListener('visibilitychange', this.#handleVisibility);
		}
		if (this.#socket && this.#socket.readyState !== this.#WebSocketImpl.CLOSED) return;
		this.#openSocket(this.#attempt > 0 ? 'reconnecting' : 'connecting');
	}

	close(): void {
		if (this.#intentionallyClosed) return;
		this.#intentionallyClosed = true;
		this.#generation += 1;
		this.#clearTimers();
		this.#networkEvents?.removeEventListener('online', this.#handleOnline);
		this.#networkEvents?.removeEventListener('offline', this.#handleOffline);
		this.#visibilityEvents?.removeEventListener('visibilitychange', this.#handleVisibility);
		const socket = this.#socket;
		this.#socket = null;
		if (socket && socket.readyState < this.#WebSocketImpl.CLOSING) {
			socket.close(1000, 'Client closed');
		}
		this.#setState('closed');
	}

	send(message: ClientMessage): boolean {
		const parsed = clientMessageSchema.safeParse(message);
		if (!parsed.success || this.#state !== 'open' || !this.#socket) return false;
		if (this.#socket.readyState !== this.#WebSocketImpl.OPEN) return false;
		try {
			this.#socket.send(JSON.stringify(parsed.data));
			return true;
		} catch {
			return false;
		}
	}

	onMessage(listener: MessageListener): () => void {
		this.#messageListeners.add(listener);
		return () => this.#messageListeners.delete(listener);
	}

	onStateChange(listener: StateListener): () => void {
		this.#stateListeners.add(listener);
		listener(this.#state);
		return () => this.#stateListeners.delete(listener);
	}

	#openSocket(nextState: 'connecting' | 'reconnecting'): void {
		this.#clearReconnectTimer();
		if (!this.#isOnline()) {
			this.#setState('offline');
			return;
		}

		const generation = ++this.#generation;
		this.#awaitingSnapshot = true;
		this.#setState(nextState);
		if (this.#intentionallyClosed || generation !== this.#generation) return;
		let socket: WebSocketLike;
		try {
			socket = new this.#WebSocketImpl(typeof this.#url === 'function' ? this.#url() : this.#url);
		} catch {
			if (generation === this.#generation) this.#scheduleReconnect();
			return;
		}
		this.#socket = socket;
		this.#connectionTimer = setTimeout(() => {
			if (generation !== this.#generation) return;
			socket.close(4000, 'Connection timed out');
		}, this.#connectionTimeoutMs);

		socket.addEventListener('message', (event) => {
			if (generation !== this.#generation || typeof event.data !== 'string') return;
			let parsedJson: unknown;
			try {
				parsedJson = JSON.parse(event.data);
			} catch {
				socket.close(1002, 'Invalid JSON');
				return;
			}
			const parsed = serverMessageSchema.safeParse(parsedJson);
			if (!parsed.success || (this.#awaitingSnapshot && parsed.data.type !== 'room.snapshot')) {
				socket.close(1002, 'Invalid protocol message');
				return;
			}
			const isInitialSnapshot = this.#awaitingSnapshot;
			if (isInitialSnapshot) this.#awaitingSnapshot = false;
			for (const listener of this.#messageListeners) listener(parsed.data);
			if (isInitialSnapshot && generation === this.#generation && !this.#intentionallyClosed) {
				this.#attempt = 0;
				this.#clearConnectionTimer();
				this.#setState('open');
			}
		});

		socket.addEventListener('close', (event) => {
			if (generation !== this.#generation || this.#intentionallyClosed) return;
			this.#socket = null;
			this.#clearConnectionTimer();
			if (isTerminalWebSocketClose(event.code)) {
				this.#clearReconnectTimer();
				this.#setState('failed');
				return;
			}
			this.#scheduleReconnect();
		});

		socket.addEventListener('error', () => {
			if (generation !== this.#generation || socket.readyState >= this.#WebSocketImpl.CLOSING)
				return;
			socket.close(1011, 'WebSocket error');
		});
	}

	#scheduleReconnect(): void {
		if (!this.#isOnline()) {
			this.#setState('offline');
			return;
		}
		this.#attempt += 1;
		this.#setState('reconnecting');
		const ceiling = Math.min(
			this.#maxReconnectDelayMs,
			this.#baseReconnectDelayMs * 2 ** Math.min(this.#attempt - 1, 10)
		);
		this.#reconnectTimer = setTimeout(
			() => this.#openSocket('reconnecting'),
			this.#random() * ceiling
		);
	}

	#handleOnline = (): void => {
		if (this.#intentionallyClosed || this.#state === 'open' || this.#state === 'failed') return;
		this.#generation += 1;
		this.#socket?.close(4001, 'Network restored');
		this.#socket = null;
		this.#attempt = 0;
		this.#clearTimers();
		this.#openSocket('reconnecting');
	};

	#handleOffline = (): void => {
		if (this.#intentionallyClosed) return;
		this.#generation += 1;
		this.#clearTimers();
		this.#socket?.close(4002, 'Network offline');
		this.#socket = null;
		this.#setState('offline');
	};

	#handleVisibility = (): void => {
		if (
			!this.#isVisible() ||
			this.#intentionallyClosed ||
			this.#state === 'open' ||
			this.#state === 'failed'
		)
			return;
		this.#handleOnline();
	};

	#setState(state: ConnectionState): void {
		if (state === this.#state) return;
		this.#state = state;
		for (const listener of this.#stateListeners) listener(state);
	}

	#clearTimers(): void {
		this.#clearReconnectTimer();
		this.#clearConnectionTimer();
	}

	#clearReconnectTimer(): void {
		if (this.#reconnectTimer === null) return;
		clearTimeout(this.#reconnectTimer);
		this.#reconnectTimer = null;
	}

	#clearConnectionTimer(): void {
		if (this.#connectionTimer === null) return;
		clearTimeout(this.#connectionTimer);
		this.#connectionTimer = null;
	}
}
