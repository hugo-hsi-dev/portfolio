import { SvelteMap } from 'svelte/reactivity';

import {
	DEFAULT_FRAME_POSITIONS,
	WORLD_COORDINATE_LIMIT,
	type ClientMessage,
	type FrameId,
	type Identity,
	type PeerState,
	type Point,
	type ServerMessage
} from '@portfolio/realtime-contract';

import type { CanvasDocument, CanvasFrame } from '$lib/features/portfolio-content';

import {
	boundsForFrames,
	cameraForBounds,
	clampZoom,
	panCamera,
	screenToWorld,
	worldToScreen,
	zoomCameraAt,
	type Camera
} from './interactions/camera';
import { resolveGestureMode } from './interactions/gestures';
import { isArrowKey, nudgeFramePosition } from './interactions/keyboard';
import {
	applyBoardServerMessage,
	clearPendingMoves,
	createInitialBoardModel,
	markFrameMoveSent,
	moveFrameLocally,
	visibleFramePosition,
	visibleFramePositions,
	type BoardModel
} from './model/board-model';
import {
	applyPeerServerMessage,
	disconnectPeers,
	EMPTY_PEER_MODEL,
	type PeerModel
} from './model/peers';
import {
	BoardSocketController,
	createBoardWebSocketUrl,
	type ConnectionState
} from './realtime/socket';
import { nextClientSequence } from './sequence';
import { shouldSendThrottled } from './throttle';
import { getOrCreateVisitorId } from './visitor';

type DragState = {
	frameId: FrameId;
	pointerId: number;
	startClient: Point;
	startFrame: Point;
};

type PinchState = { distance: number; camera: Camera; center: Point };

export interface BoardSocketClient {
	connect(): void;
	close(): void;
	send(message: ClientMessage): boolean;
	onMessage(listener: (message: ServerMessage) => void): () => void;
	onStateChange(listener: (state: ConnectionState) => void): () => void;
}

export interface PortfolioBoardDependencies {
	createSocket?: () => BoardSocketClient;
	now?: () => number;
	requestFrame?: (callback: FrameRequestCallback) => number;
	fetch?: typeof globalThis.fetch;
	prefersReducedMotion?: () => boolean;
	focusFrame?: (frameId: FrameId) => void;
}

export class PortfolioBoardController {
	readonly frames: CanvasFrame[];

	model = $state.raw<BoardModel>(createInitialBoardModel(DEFAULT_FRAME_POSITIONS));
	peerModel = $state.raw<PeerModel>(EMPTY_PEER_MODEL);
	camera = $state.raw<Camera>({ x: 72, y: 104, zoom: 0.78 });
	selectedFrameId = $state<FrameId | null>('profile');
	dragState = $state.raw<DragState | null>(null);
	panPointerId = $state<number | null>(null);
	connectionState = $state<ConnectionState>('connecting');
	layersOpen = $state(true);
	mobileLayersOpen = $state(false);
	mobileLayerDestination = $state<FrameId | null>(null);
	browseOpen = $state(false);
	resetDialogOpen = $state(false);
	ownerKey = $state('');
	resetError = $state('');
	resetPending = $state(false);
	reducedMotion = $state(false);

	#viewport: HTMLDivElement | null = null;
	#panLastPoint: Point | null = null;
	#sequence = 0;
	#socketController: BoardSocketClient | null = null;
	#lastPresenceSent = 0;
	#lastFrameSent = 0;
	#didInitialFocus = false;
	#pinchStart: PinchState | null = null;
	readonly #activePointers = new SvelteMap<number, Point>();
	readonly #createSocket: () => BoardSocketClient;
	readonly #now: () => number;
	readonly #requestFrame: (callback: FrameRequestCallback) => number;
	readonly #fetch: typeof globalThis.fetch;
	readonly #prefersReducedMotion: () => boolean;
	readonly #focusFrame: (frameId: FrameId) => void;

	constructor(canvasDocument: CanvasDocument, dependencies: PortfolioBoardDependencies = {}) {
		this.frames = canvasDocument.frames;
		this.#createSocket =
			dependencies.createSocket ??
			(() =>
				new BoardSocketController({
					url: () =>
						createBoardWebSocketUrl(getOrCreateVisitorId(localStorage, () => crypto.randomUUID()))
				}));
		this.#now = dependencies.now ?? (() => performance.now());
		this.#requestFrame =
			dependencies.requestFrame ?? ((callback) => globalThis.requestAnimationFrame(callback));
		this.#fetch = dependencies.fetch ?? globalThis.fetch;
		this.#prefersReducedMotion =
			dependencies.prefersReducedMotion ??
			(() => globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches);
		this.#focusFrame =
			dependencies.focusFrame ??
			((frameId) => {
				globalThis.document.querySelector<HTMLElement>(`[data-frame-id="${frameId}"]`)?.focus();
			});
	}

	get positions(): Record<FrameId, Point> {
		return visibleFramePositions(this.model);
	}

	get selectedFrame(): CanvasFrame | null {
		return this.frames.find((frame) => frame.id === this.selectedFrameId) ?? null;
	}

	get zoomPercent(): number {
		return Math.round(this.camera.zoom * 100);
	}

	get editingReady(): boolean {
		return this.connectionState === 'open';
	}

	get collaborators(): (Identity | PeerState)[] {
		return this.peerModel.self
			? [this.peerModel.self, ...this.peerModel.peers]
			: this.peerModel.peers;
	}

	mount(viewport: HTMLDivElement): () => void {
		this.#viewport = viewport;
		this.reducedMotion = this.#prefersReducedMotion();
		this.#socketController = this.#createSocket();
		const removeMessageListener = this.#socketController.onMessage(this.#handleServerMessage);
		const removeStateListener = this.#socketController.onStateChange(this.#handleConnectionState);
		this.#socketController.connect();

		return () => {
			removeMessageListener();
			removeStateListener();
			this.#socketController?.close();
			this.#socketController = null;
			this.#viewport = null;
		};
	}

	framePosition(frameId: FrameId): Point {
		return visibleFramePosition(this.model, frameId);
	}

	peerScreenPosition(peer: PeerState): Point {
		return worldToScreen(peer.cursor ?? { x: 0, y: 0 }, this.camera);
	}

	onFramePointerDown = (event: PointerEvent, frameId: FrameId): void => {
		if ((event.target as HTMLElement).closest('a, button, input, textarea, select')) return;
		this.selectedFrameId = frameId;
		this.#sendPresence(event.clientX, event.clientY, true);
		if (!this.editingReady || event.button !== 0) return;
		event.preventDefault();
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
		this.dragState = {
			frameId,
			pointerId: event.pointerId,
			startClient: { x: event.clientX, y: event.clientY },
			startFrame: this.framePosition(frameId)
		};
	};

	onViewportPointerDown = (event: PointerEvent): void => {
		if (!this.#viewport) return;
		this.#viewport.focus({ preventScroll: true });
		this.#activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
		if ((event.target as HTMLElement).closest('[data-frame-id], button, a, input')) return;
		this.selectedFrameId = null;
		if (event.button !== 0) return;
		this.#viewport.setPointerCapture(event.pointerId);
		this.panPointerId = event.pointerId;
		this.#panLastPoint = { x: event.clientX, y: event.clientY };
	};

	onPointerMove = (event: PointerEvent): void => {
		if (!this.#viewport) return;
		this.#activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
		const gesture = resolveGestureMode(
			this.#activePointers.size,
			this.dragState?.pointerId === event.pointerId,
			this.panPointerId === event.pointerId && this.#panLastPoint !== null
		);
		if (gesture === 'pinch') {
			this.panPointerId = null;
			this.#panLastPoint = null;
			this.dragState = null;
			const [a, b] = [...this.#activePointers.values()];
			const distance = Math.hypot(a.x - b.x, a.y - b.y);
			const center = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
			if (!this.#pinchStart) {
				this.#pinchStart = { distance, camera: { ...this.camera }, center };
			}
			const ratio = distance / Math.max(this.#pinchStart.distance, 1);
			const rect = this.#viewport.getBoundingClientRect();
			const startCenter = {
				x: this.#pinchStart.center.x - rect.left,
				y: this.#pinchStart.center.y - rect.top
			};
			const currentCenter = { x: center.x - rect.left, y: center.y - rect.top };
			const zoomedCamera = zoomCameraAt(
				this.#pinchStart.camera,
				startCenter,
				this.#pinchStart.camera.zoom * ratio
			);
			this.camera = panCamera(zoomedCamera, {
				x: currentCenter.x - startCenter.x,
				y: currentCenter.y - startCenter.y
			});
			return;
		}

		if (gesture === 'drag' && this.dragState) {
			const dx = (event.clientX - this.dragState.startClient.x) / this.camera.zoom;
			const dy = (event.clientY - this.dragState.startClient.y) / this.camera.zoom;
			const next = {
				x: this.#clampCoordinate(this.dragState.startFrame.x + dx),
				y: this.#clampCoordinate(this.dragState.startFrame.y + dy)
			};
			this.model = moveFrameLocally(this.model, this.dragState.frameId, next);
			const now = this.#now();
			if (shouldSendThrottled(now, this.#lastFrameSent, 50)) {
				this.#sendFrameMove(this.dragState.frameId, next, false);
				this.#lastFrameSent = now;
			}
			this.#sendPresence(event.clientX, event.clientY);
			return;
		}

		if (gesture === 'pan' && this.#panLastPoint) {
			this.camera = panCamera(this.camera, {
				x: event.clientX - this.#panLastPoint.x,
				y: event.clientY - this.#panLastPoint.y
			});
			this.#panLastPoint = { x: event.clientX, y: event.clientY };
		}
		this.#sendPresence(event.clientX, event.clientY);
	};

	onPointerUp = (event: PointerEvent): void => {
		this.#activePointers.delete(event.pointerId);
		if (this.#activePointers.size < 2) this.#pinchStart = null;
		if (this.dragState?.pointerId === event.pointerId) {
			const frameId = this.dragState.frameId;
			this.#sendFrameMove(frameId, this.framePosition(frameId), true);
			this.dragState = null;
		}
		if (this.panPointerId === event.pointerId) {
			this.panPointerId = null;
			this.#panLastPoint = null;
		}
	};

	onWheel = (event: WheelEvent): void => {
		event.preventDefault();
		if (event.ctrlKey || event.metaKey) {
			this.setZoom(
				this.camera.zoom * Math.exp(-event.deltaY * 0.006),
				event.clientX,
				event.clientY
			);
		} else {
			this.camera = panCamera(this.camera, { x: -event.deltaX, y: -event.deltaY });
		}
	};

	onKeydown = (event: KeyboardEvent): void => {
		if (event.key === 'Escape') {
			if (this.mobileLayersOpen || this.browseOpen || this.resetDialogOpen) return;
			this.selectedFrameId = null;
			return;
		}
		if (!this.selectedFrameId || !this.editingReady || !isArrowKey(event.key)) return;
		const target = event.target as HTMLElement;
		if (!target.matches('[data-canvas-viewport], [data-frame-id]')) return;
		event.preventDefault();
		const next = nudgeFramePosition(
			this.framePosition(this.selectedFrameId),
			event.key,
			event.shiftKey
		);
		this.model = moveFrameLocally(this.model, this.selectedFrameId, next);
		this.#sendFrameMove(this.selectedFrameId, next, true);
	};

	setZoom(nextZoom: number, clientX?: number, clientY?: number, baseCamera = this.camera): void {
		if (!this.#viewport) {
			this.camera = { ...baseCamera, zoom: clampZoom(nextZoom) };
			return;
		}
		const rect = this.#viewport.getBoundingClientRect();
		const anchorX = (clientX ?? rect.left + rect.width / 2) - rect.left;
		const anchorY = (clientY ?? rect.top + rect.height / 2) - rect.top;
		this.camera = zoomCameraAt(baseCamera, { x: anchorX, y: anchorY }, nextZoom);
	}

	fitAll = (): void => {
		this.#focusBounds(this.#frameBounds(), 64);
	};

	fitSelection = (): void => {
		if (!this.selectedFrame) return;
		const position = this.framePosition(this.selectedFrame.id);
		this.#focusBounds(
			{ ...position, width: this.selectedFrame.width, height: this.selectedFrame.height },
			96
		);
	};

	goToFrame = (frame: CanvasFrame): void => {
		this.selectedFrameId = frame.id;
		const position = this.framePosition(frame.id);
		this.#focusBounds({ ...position, width: frame.width, height: frame.height }, 96);
		this.mobileLayersOpen = false;
		this.#requestFrame(() => this.#focusFrame(frame.id));
	};

	goToFrameFromMobileLayers = (frame: CanvasFrame): void => {
		this.mobileLayerDestination = frame.id;
		this.goToFrame(frame);
	};

	onMobileLayersCloseAutoFocus = (event: Event): void => {
		if (!this.mobileLayerDestination) return;
		event.preventDefault();
		const destination = this.mobileLayerDestination;
		this.mobileLayerDestination = null;
		this.#requestFrame(() => this.#focusFrame(destination));
	};

	resetBoard = async (): Promise<void> => {
		this.resetPending = true;
		this.resetError = '';
		try {
			const response = await this.#fetch('/api/board/reset', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ token: this.ownerKey })
			});
			if (!response.ok) {
				throw new Error(
					response.status === 401
						? 'The owner key was not accepted.'
						: 'The board could not be reset.'
				);
			}
			this.ownerKey = '';
			this.resetDialogOpen = false;
		} catch (error) {
			this.resetError = error instanceof Error ? error.message : 'The board could not be reset.';
		} finally {
			this.resetPending = false;
		}
	};

	onResetDialogOpenChange = (open: boolean): void => {
		if (!open) {
			this.ownerKey = '';
			this.resetError = '';
		}
	};

	#handleServerMessage = (message: ServerMessage): void => {
		const wasSnapshot = this.model.hasSnapshot;
		this.model = applyBoardServerMessage(
			this.model,
			message,
			this.peerModel.self?.sessionId ?? null
		);
		this.peerModel = applyPeerServerMessage(this.peerModel, message);

		if (message.type === 'room.snapshot' && !wasSnapshot && !this.#didInitialFocus) {
			this.#didInitialFocus = true;
			this.#requestFrame(() => {
				const profile = this.frames.find((frame) => frame.id === 'profile');
				if (!profile) return;
				const position = this.framePosition(profile.id);
				this.#focusBounds({ ...position, width: profile.width, height: profile.height }, 110);
			});
		}
		if (message.type === 'board.reset') {
			this.dragState = null;
			this.fitAll();
		}
	};

	#handleConnectionState = (state: ConnectionState): void => {
		this.connectionState = state;
		if (state !== 'open') {
			this.dragState = null;
			this.peerModel = disconnectPeers(this.peerModel);
			this.model = clearPendingMoves(this.model);
		}
	};

	#send(message: ClientMessage): boolean {
		return this.#socketController?.send(message) ?? false;
	}

	#sendFrameMove(frameId: FrameId, position: Point, final: boolean): void {
		const sequence = (this.#sequence = nextClientSequence(this.#sequence));
		if (this.#send({ type: 'frame.move', seq: sequence, frameId, ...position, final })) {
			this.model = markFrameMoveSent(this.model, frameId, sequence);
		}
	}

	#sendPresence(clientX: number, clientY: number, force = false): void {
		if (!this.#viewport || !this.editingReady) return;
		const now = this.#now();
		if (!shouldSendThrottled(now, this.#lastPresenceSent, 50, force)) return;
		const rect = this.#viewport.getBoundingClientRect();
		const cursor = screenToWorld({ x: clientX - rect.left, y: clientY - rect.top }, this.camera);
		this.#send({
			type: 'presence.update',
			seq: (this.#sequence = nextClientSequence(this.#sequence)),
			cursor,
			selectedFrameId: this.selectedFrameId
		});
		this.#lastPresenceSent = now;
	}

	#frameBounds() {
		return boundsForFrames(
			this.frames.map((frame) => ({
				id: frame.id,
				...this.framePosition(frame.id),
				width: frame.width,
				height: frame.height
			}))
		);
	}

	#focusBounds(
		bounds: { x: number; y: number; width: number; height: number },
		padding = 88
	): void {
		if (!this.#viewport) return;
		const rect = this.#viewport.getBoundingClientRect();
		const adaptivePadding = Math.min(
			padding,
			Math.max(20, Math.min(rect.width, rect.height) * 0.1)
		);
		this.camera = cameraForBounds(
			bounds,
			{ width: rect.width, height: rect.height },
			adaptivePadding,
			2
		);
	}

	#clampCoordinate(value: number): number {
		return Math.max(-WORLD_COORDINATE_LIMIT, Math.min(WORLD_COORDINATE_LIMIT, value));
	}
}
