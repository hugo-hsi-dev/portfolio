import { SvelteMap, SvelteSet } from 'svelte/reactivity';

import {
	DEFAULT_FRAME_POSITIONS,
	type ClientMessage,
	type FrameId,
	type FramePosition,
	type Identity,
	type PeerState,
	type Point,
	type ServerMessage,
	type ViewState
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
	type Bounds,
	type Camera
} from './interactions/camera';
import { resolveGestureMode } from './interactions/gestures';
import { isArrowKey } from './interactions/keyboard';
import {
	alignSelection as alignSelectionGeometry,
	distributeSelection as distributeSelectionGeometry,
	getSelectionBounds,
	normalizeMarqueeRect,
	selectFramesIntersectingMarquee,
	snapSelection,
	translateSelection,
	type DistributionAxis,
	type SelectionAlignment,
	type SnapGuide
} from './interactions/selection';
import {
	applyBoardServerMessage,
	clearPendingMoves,
	createInitialBoardModel,
	markFrameMoveSent,
	moveFrameLocally,
	visibleFrameMetadata,
	visibleFramePosition,
	visibleFramePositions,
	type BoardModel,
	type FrameMetadata
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

export type CanvasTool = 'move' | 'hand';

type DragState = {
	frameIds: FrameId[];
	pointerId: number;
	startClient: Point;
	startPositions: FramePosition[];
	latestDelta: Point;
	moved: boolean;
};

type MarqueeState = {
	pointerId: number;
	startClient: Point;
	startWorld: Point;
	currentWorld: Point;
	baseSelection: FrameId[];
	additive: boolean;
	moved: boolean;
};

type PinchState = { distance: number; camera: Camera; center: Point };

type HistoryEntry = {
	label: string;
	before: FramePosition[];
	after: FramePosition[];
};

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

const DRAG_THRESHOLD = 3;
const MOBILE_BREAKPOINT = 760;

export class PortfolioBoardController {
	readonly frames: CanvasFrame[];

	model = $state.raw<BoardModel>(createInitialBoardModel(DEFAULT_FRAME_POSITIONS));
	peerModel = $state.raw<PeerModel>(EMPTY_PEER_MODEL);
	camera = $state.raw<Camera>({ x: 72, y: 104, zoom: 0.78 });
	selectedFrameIds = $state.raw<FrameId[]>(['profile']);
	hoveredFrameId = $state<FrameId | null>(null);
	dragState = $state.raw<DragState | null>(null);
	marqueeState = $state.raw<MarqueeState | null>(null);
	snapGuides = $state.raw<SnapGuide[]>([]);
	panPointerId = $state<number | null>(null);
	tool = $state<CanvasTool>('move');
	spacePanning = $state(false);
	connectionState = $state<ConnectionState>('connecting');
	layersOpen = $state(true);
	propertiesOpen = $state(true);
	mobileLayersOpen = $state(false);
	mobileLayerDestination = $state<FrameId | null>(null);
	mobileViewport = $state(false);
	browseOpen = $state(false);
	shortcutDialogOpen = $state(false);
	resetDialogOpen = $state(false);
	ownerKey = $state('');
	resetError = $state('');
	resetPending = $state(false);
	reducedMotion = $state(false);
	followingSessionId = $state<string | null>(null);
	editorNotice = $state('');
	historyIndex = $state(0);

	#viewport: HTMLDivElement | null = null;
	#panLastPoint: Point | null = null;
	#sequence = 0;
	#socketController: BoardSocketClient | null = null;
	#lastPresenceSent = 0;
	#lastFrameSent = 0;
	#lastCursor: Point | null = null;
	#didInitialFocus = false;
	#didChooseMobileEntry = false;
	#pinchStart: PinchState | null = null;
	#history: HistoryEntry[] = [];
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

	/** Compatibility bridge for existing single-selection call sites and presence. */
	get selectedFrameId(): FrameId | null {
		return this.selectedFrameIds.at(-1) ?? null;
	}

	set selectedFrameId(frameId: FrameId | null) {
		this.selectedFrameIds = frameId ? [frameId] : [];
	}

	get positions(): Record<FrameId, Point> {
		return visibleFramePositions(this.model);
	}

	get visibleFrames(): CanvasFrame[] {
		return this.frames.filter((frame) => this.frameMetadata(frame.id).visible);
	}

	get selectedFrames(): CanvasFrame[] {
		const selected = new SvelteSet(this.selectedFrameIds);
		return this.frames.filter((frame) => selected.has(frame.id));
	}

	get selectedFrame(): CanvasFrame | null {
		const selectedFrameId = this.selectedFrameId;
		return this.frames.find((frame) => frame.id === selectedFrameId) ?? null;
	}

	get selectionPositions(): FramePosition[] {
		return this.selectedFrameIds.map((id) => ({ id, ...this.framePosition(id) }));
	}

	get selectionBounds(): Bounds | null {
		return getSelectionBounds(this.selectionPositions);
	}

	get visibleSelectionPositions(): FramePosition[] {
		return this.selectionPositions.filter((position) => this.frameMetadata(position.id).visible);
	}

	get visibleSelectionBounds(): Bounds | null {
		return getSelectionBounds(this.visibleSelectionPositions);
	}

	get visibleSelectionCount(): number {
		return this.visibleSelectionPositions.length;
	}

	get marqueeBounds(): Bounds | null {
		if (!this.marqueeState) return null;
		return normalizeMarqueeRect(this.marqueeState.startWorld, this.marqueeState.currentWorld);
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

	get followingPeer(): PeerState | null {
		return this.peerModel.peers.find((peer) => peer.sessionId === this.followingSessionId) ?? null;
	}

	get canUndo(): boolean {
		return this.historyIndex > 0 && this.editingReady;
	}

	get canRedo(): boolean {
		return this.historyIndex < this.#history.length && this.editingReady;
	}

	get selectionAllVisible(): boolean {
		return (
			this.selectedFrameIds.length > 0 &&
			this.selectedFrameIds.every((id) => this.frameMetadata(id).visible)
		);
	}

	get selectionAllLocked(): boolean {
		return (
			this.selectedFrameIds.length > 0 &&
			this.selectedFrameIds.every((id) => this.frameMetadata(id).locked)
		);
	}

	mount(viewport: HTMLDivElement): () => void {
		this.#viewport = viewport;
		this.reducedMotion = this.#prefersReducedMotion();
		this.#refreshViewportMode();
		globalThis.addEventListener('resize', this.#refreshViewportMode);
		this.#socketController = this.#createSocket();
		const removeMessageListener = this.#socketController.onMessage(this.#handleServerMessage);
		const removeStateListener = this.#socketController.onStateChange(this.#handleConnectionState);
		this.#socketController.connect();

		return () => {
			removeMessageListener();
			removeStateListener();
			globalThis.removeEventListener('resize', this.#refreshViewportMode);
			this.#socketController?.close();
			this.#socketController = null;
			this.#viewport = null;
		};
	}

	framePosition(frameId: FrameId): Point {
		return visibleFramePosition(this.model, frameId);
	}

	frameMetadata(frameId: FrameId): FrameMetadata {
		return visibleFrameMetadata(this.model, frameId);
	}

	isSelected(frameId: FrameId): boolean {
		return this.selectedFrameIds.includes(frameId);
	}

	isDragging(frameId: FrameId): boolean {
		return this.dragState?.frameIds.includes(frameId) ?? false;
	}

	remoteSelection(frameId: FrameId): PeerState | null {
		return this.peerModel.peers.find((peer) => peer.selectedFrameId === frameId) ?? null;
	}

	peerScreenPosition(peer: PeerState): Point {
		return worldToScreen(peer.cursor ?? { x: 0, y: 0 }, this.camera);
	}

	setTool = (tool: CanvasTool): void => {
		this.tool = tool;
		this.spacePanning = false;
		this.stopFollowing();
	};

	selectFrame = (frameId: FrameId, additive = false): void => {
		if (!additive) {
			this.selectedFrameIds = [frameId];
		} else if (this.isSelected(frameId)) {
			this.selectedFrameIds = this.selectedFrameIds.filter((id) => id !== frameId);
		} else {
			this.selectedFrameIds = [...this.selectedFrameIds, frameId];
		}
		this.#sendPresence(undefined, undefined, true);
	};

	selectFrameFromLayer = (event: MouseEvent, frame: CanvasFrame): void => {
		this.selectFrame(frame.id, event.shiftKey || event.metaKey || event.ctrlKey);
	};

	selectAll = (): void => {
		this.selectedFrameIds = this.visibleFrames.map((frame) => frame.id);
		this.#sendPresence(undefined, undefined, true);
	};

	onFrameFocus = (frameId: FrameId): void => {
		if (!this.isSelected(frameId)) this.selectFrame(frameId);
	};

	onFramePointerDown = (event: PointerEvent, frameId: FrameId): void => {
		if ((event.target as HTMLElement).closest('a, button, input, textarea, select')) return;
		const additive = event.shiftKey || event.metaKey || event.ctrlKey;
		const wasSelected = this.isSelected(frameId);
		if (additive) this.selectFrame(frameId, true);
		else if (!wasSelected) this.selectFrame(frameId);
		else this.#sendPresence(event.clientX, event.clientY, true);

		if (
			!this.editingReady ||
			event.button !== 0 ||
			this.tool === 'hand' ||
			this.spacePanning ||
			this.frameMetadata(frameId).locked ||
			(additive && wasSelected)
		) {
			return;
		}

		const frameIds = this.selectedFrameIds.filter((id) => {
			const metadata = this.frameMetadata(id);
			return metadata.visible && !metadata.locked;
		});
		if (frameIds.length === 0) return;
		event.preventDefault();
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
		this.stopFollowing();
		this.dragState = {
			frameIds,
			pointerId: event.pointerId,
			startClient: { x: event.clientX, y: event.clientY },
			startPositions: frameIds.map((id) => ({ id, ...this.framePosition(id) })),
			latestDelta: { x: 0, y: 0 },
			moved: false
		};
	};

	onViewportPointerDown = (event: PointerEvent): void => {
		if (!this.#viewport) return;
		this.#viewport.focus({ preventScroll: true });
		this.#activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
		if (
			(event.target as HTMLElement).closest('[data-frame-id], button, a, input, textarea, select')
		) {
			return;
		}

		const shouldPan =
			event.button === 1 ||
			this.tool === 'hand' ||
			this.spacePanning ||
			event.pointerType === 'touch';
		if (shouldPan) {
			if (event.button > 1) return;
			this.stopFollowing();
			this.#viewport.setPointerCapture(event.pointerId);
			this.panPointerId = event.pointerId;
			this.#panLastPoint = { x: event.clientX, y: event.clientY };
			return;
		}

		if (event.button !== 0) return;
		const rect = this.#viewport.getBoundingClientRect();
		const startWorld = screenToWorld(
			{ x: event.clientX - rect.left, y: event.clientY - rect.top },
			this.camera
		);
		const additive = event.shiftKey || event.metaKey || event.ctrlKey;
		if (!additive) this.selectedFrameIds = [];
		this.#viewport.setPointerCapture(event.pointerId);
		this.marqueeState = {
			pointerId: event.pointerId,
			startClient: { x: event.clientX, y: event.clientY },
			startWorld,
			currentWorld: startWorld,
			baseSelection: additive ? [...this.selectedFrameIds] : [],
			additive,
			moved: false
		};
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
			this.stopFollowing();
			this.panPointerId = null;
			this.#panLastPoint = null;
			this.dragState = null;
			this.marqueeState = null;
			this.snapGuides = [];
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
			this.#sendPresence(event.clientX, event.clientY);
			return;
		}

		if (gesture === 'drag' && this.dragState) {
			const requestedDelta = {
				x: (event.clientX - this.dragState.startClient.x) / this.camera.zoom,
				y: (event.clientY - this.dragState.startClient.y) / this.camera.zoom
			};
			const snap =
				event.ctrlKey || event.metaKey
					? { delta: requestedDelta, guides: [] }
					: snapSelection(
							this.dragState.startPositions,
							requestedDelta,
							this.visibleFrames.map((frame) => ({
								id: frame.id,
								...this.framePosition(frame.id)
							})),
							6 / this.camera.zoom
						);
			const translated = translateSelection(this.dragState.startPositions, snap.delta);
			this.dragState = {
				...this.dragState,
				latestDelta: translated.delta,
				moved:
					this.dragState.moved ||
					Math.hypot(
						event.clientX - this.dragState.startClient.x,
						event.clientY - this.dragState.startClient.y
					) >= DRAG_THRESHOLD
			};
			this.snapGuides = snap.guides;
			this.#moveLocally(translated.positions);

			const now = this.#now();
			const interval = Math.max(55, this.dragState.frameIds.length * 45);
			if (shouldSendThrottled(now, this.#lastFrameSent, interval)) {
				for (const position of translated.positions)
					this.#sendFrameMove(position.id, position, false);
				this.#lastFrameSent = now;
			}
			this.#sendPresence(event.clientX, event.clientY);
			return;
		}

		if (this.marqueeState?.pointerId === event.pointerId) {
			const rect = this.#viewport.getBoundingClientRect();
			const currentWorld = screenToWorld(
				{ x: event.clientX - rect.left, y: event.clientY - rect.top },
				this.camera
			);
			const moved =
				this.marqueeState.moved ||
				Math.hypot(
					event.clientX - this.marqueeState.startClient.x,
					event.clientY - this.marqueeState.startClient.y
				) >= DRAG_THRESHOLD;
			this.marqueeState = { ...this.marqueeState, currentWorld, moved };
			if (moved) {
				const intersecting = selectFramesIntersectingMarquee(
					this.visibleFrames
						.filter((frame) => !this.frameMetadata(frame.id).locked)
						.map((frame) => ({ id: frame.id, ...this.framePosition(frame.id) })),
					normalizeMarqueeRect(this.marqueeState.startWorld, currentWorld)
				);
				this.selectedFrameIds = this.marqueeState.additive
					? [...new SvelteSet([...this.marqueeState.baseSelection, ...intersecting])]
					: intersecting;
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
			const drag = this.dragState;
			const after = drag.frameIds.map((id) => ({ id, ...this.framePosition(id) }));
			if (drag.moved) {
				for (const position of after) this.#sendFrameMove(position.id, position, true);
				this.#recordHistory(
					drag.frameIds.length > 1 ? 'Move selection' : 'Move frame',
					drag.startPositions,
					after
				);
			}
			this.dragState = null;
			this.snapGuides = [];
		}
		if (this.marqueeState?.pointerId === event.pointerId) {
			this.marqueeState = null;
			this.#sendPresence(event.clientX, event.clientY, true);
		}
		if (this.panPointerId === event.pointerId) {
			this.panPointerId = null;
			this.#panLastPoint = null;
			this.#sendPresence(event.clientX, event.clientY, true);
		}
	};

	onWheel = (event: WheelEvent): void => {
		event.preventDefault();
		this.stopFollowing();
		if (event.ctrlKey || event.metaKey) {
			this.setZoom(
				this.camera.zoom * Math.exp(-event.deltaY * 0.006),
				event.clientX,
				event.clientY
			);
		} else {
			this.camera = panCamera(this.camera, { x: -event.deltaX, y: -event.deltaY });
			this.#sendPresence(event.clientX, event.clientY);
		}
	};

	onKeydown = (event: KeyboardEvent): void => {
		if (this.#isTypingTarget(event.target)) return;
		const command = event.metaKey || event.ctrlKey;
		const key = event.key.toLowerCase();

		if (event.key === 'Escape') {
			if (
				this.mobileLayersOpen ||
				this.browseOpen ||
				this.resetDialogOpen ||
				this.shortcutDialogOpen
			) {
				return;
			}
			if (this.followingSessionId) this.stopFollowing();
			else this.selectedFrameIds = [];
			this.#sendPresence(undefined, undefined, true);
			return;
		}

		if (event.code === 'Space' && !event.repeat) {
			event.preventDefault();
			this.spacePanning = true;
			return;
		}

		if (command && key === 'a') {
			event.preventDefault();
			this.selectAll();
			return;
		}
		if (command && key === 'z') {
			event.preventDefault();
			if (event.shiftKey) this.redo();
			else this.undo();
			return;
		}
		if (command && event.shiftKey && key === 'h') {
			event.preventDefault();
			this.toggleSelectionVisibility();
			return;
		}
		if (command && event.shiftKey && key === 'l') {
			event.preventDefault();
			this.toggleSelectionLock();
			return;
		}

		if (event.shiftKey && event.key === '1') {
			event.preventDefault();
			this.fitAll();
			return;
		}
		if (event.shiftKey && event.key === '2') {
			event.preventDefault();
			this.fitSelection();
			return;
		}
		if (!command && !event.altKey && key === 'v') {
			this.setTool('move');
			return;
		}
		if (!command && !event.altKey && key === 'h') {
			this.setTool('hand');
			return;
		}
		if (event.key === '?' && !command) {
			this.shortcutDialogOpen = true;
			return;
		}

		if (!isArrowKey(event.key) || this.selectedFrameIds.length === 0 || !this.editingReady) {
			return;
		}
		const target = event.target as HTMLElement;
		if (!target.matches('[data-canvas-viewport], [data-frame-id], body')) return;
		event.preventDefault();
		const amount = event.shiftKey ? 10 : 1;
		const delta = {
			x: event.key === 'ArrowLeft' ? -amount : event.key === 'ArrowRight' ? amount : 0,
			y: event.key === 'ArrowUp' ? -amount : event.key === 'ArrowDown' ? amount : 0
		};
		const movable = this.selectionPositions.filter(
			(position) => !this.frameMetadata(position.id).locked
		);
		const translated = translateSelection(movable, delta);
		this.#commitPositions(
			translated.positions,
			movable.length > 1 ? 'Nudge selection' : 'Nudge frame'
		);
	};

	onKeyup = (event: KeyboardEvent): void => {
		if (event.code === 'Space') this.spacePanning = false;
	};

	setZoom(nextZoom: number, clientX?: number, clientY?: number, baseCamera = this.camera): void {
		this.stopFollowing();
		if (!this.#viewport) {
			this.camera = { ...baseCamera, zoom: clampZoom(nextZoom) };
			return;
		}
		const rect = this.#viewport.getBoundingClientRect();
		const anchorX = (clientX ?? rect.left + rect.width / 2) - rect.left;
		const anchorY = (clientY ?? rect.top + rect.height / 2) - rect.top;
		this.camera = zoomCameraAt(baseCamera, { x: anchorX, y: anchorY }, nextZoom);
		this.#sendPresence(undefined, undefined, true);
	}

	fitAll = (): void => {
		this.stopFollowing();
		this.#focusBounds(this.#frameBounds(), 64);
	};

	fitSelection = (): void => {
		const bounds = this.selectionBounds;
		if (!bounds) return;
		this.stopFollowing();
		this.#focusBounds(bounds, 96);
	};

	goToFrame = (frame: CanvasFrame): void => {
		this.selectFrame(frame.id);
		if (this.frameMetadata(frame.id).visible) {
			const position = this.framePosition(frame.id);
			this.stopFollowing();
			this.#focusBounds({ ...position, width: frame.width, height: frame.height }, 96);
			this.#requestFrame(() => this.#focusFrame(frame.id));
		}
		this.mobileLayersOpen = false;
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

	toggleFrameVisibility = (frameId: FrameId): void => {
		const visible = !this.frameMetadata(frameId).visible;
		if (!this.#sendFrameMetadata(frameId, { visible })) return;
		if (!visible) this.selectedFrameIds = this.selectedFrameIds.filter((id) => id !== frameId);
	};

	toggleFrameLock = (frameId: FrameId): void => {
		this.#sendFrameMetadata(frameId, { locked: !this.frameMetadata(frameId).locked });
	};

	toggleSelectionVisibility = (): void => {
		if (this.selectedFrameIds.length === 0 || !this.editingReady) return;
		const visible = !this.selectionAllVisible;
		const selected = [...this.selectedFrameIds];
		for (const frameId of selected) this.#sendFrameMetadata(frameId, { visible });
		if (!visible) this.selectedFrameIds = [];
	};

	toggleSelectionLock = (): void => {
		if (this.selectedFrameIds.length === 0 || !this.editingReady) return;
		const locked = !this.selectionAllLocked;
		for (const frameId of this.selectedFrameIds) this.#sendFrameMetadata(frameId, { locked });
	};

	alignSelection = (alignment: SelectionAlignment): void => {
		const movable = this.selectionPositions.filter(
			(position) => !this.frameMetadata(position.id).locked
		);
		if (movable.length < 2) return;
		this.#commitPositions(alignSelectionGeometry(movable, alignment), `Align ${alignment}`);
	};

	distributeSelection = (axis: DistributionAxis): void => {
		const movable = this.selectionPositions.filter(
			(position) => !this.frameMetadata(position.id).locked
		);
		if (movable.length < 3) return;
		this.#commitPositions(distributeSelectionGeometry(movable, axis), `Distribute ${axis}`);
	};

	setSelectionAxis = (axis: 'x' | 'y', value: number): void => {
		const bounds = this.selectionBounds;
		if (!bounds || !Number.isFinite(value)) return;
		const movable = this.selectionPositions.filter(
			(position) => !this.frameMetadata(position.id).locked
		);
		const requested = axis === 'x' ? { x: value - bounds.x, y: 0 } : { x: 0, y: value - bounds.y };
		this.#commitPositions(
			translateSelection(movable, requested).positions,
			`Set ${axis.toUpperCase()}`
		);
	};

	undo = (): void => {
		if (!this.canUndo) return;
		const entry = this.#history[this.historyIndex - 1];
		this.historyIndex -= 1;
		this.#applyHistoryPositions(entry.before);
		this.editorNotice = `Undid ${entry.label.toLowerCase()}`;
	};

	redo = (): void => {
		if (!this.canRedo) return;
		const entry = this.#history[this.historyIndex];
		this.historyIndex += 1;
		this.#applyHistoryPositions(entry.after);
		this.editorNotice = `Redid ${entry.label.toLowerCase()}`;
	};

	followCollaborator = (peer: PeerState): void => {
		if (this.followingSessionId === peer.sessionId) {
			this.stopFollowing();
			return;
		}
		if (!peer.view) {
			this.editorNotice = `${peer.name} has not shared a canvas view yet.`;
			return;
		}
		this.followingSessionId = peer.sessionId;
		this.#applyFollowView(peer.view);
	};

	stopFollowing = (): void => {
		this.followingSessionId = null;
	};

	clearNotice = (): void => {
		this.editorNotice = '';
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

		if (message.type === 'error') {
			this.editorNotice = message.message;
			if (message.code === 'frame-locked') {
				this.model = clearPendingMoves(this.model);
				this.dragState = null;
				this.snapGuides = [];
			}
			return;
		}

		if (message.type === 'peer.leave' && message.sessionId === this.followingSessionId) {
			this.stopFollowing();
			this.editorNotice = 'Follow ended because the collaborator left.';
		}
		if (
			message.type === 'peer.update' &&
			message.sessionId === this.followingSessionId &&
			message.view
		) {
			this.#applyFollowView(message.view);
		}
		if (message.type === 'frame.update' && !message.frame.visible) {
			this.selectedFrameIds = this.selectedFrameIds.filter((id) => id !== message.frame.id);
		}

		if (message.type === 'room.snapshot' && !wasSnapshot && !this.#didInitialFocus) {
			this.#didInitialFocus = true;
			if (!this.mobileViewport) {
				this.#requestFrame(() => {
					const profile = this.frames.find((frame) => frame.id === 'profile');
					if (!profile) return;
					const position = this.framePosition(profile.id);
					this.#focusBounds({ ...position, width: profile.width, height: profile.height }, 110);
				});
			}
		}
		if (message.type === 'board.reset') {
			this.dragState = null;
			this.marqueeState = null;
			this.snapGuides = [];
			this.selectedFrameIds = ['profile'];
			this.#history = [];
			this.historyIndex = 0;
			this.fitAll();
		}
	};

	#handleConnectionState = (state: ConnectionState): void => {
		this.connectionState = state;
		if (state !== 'open') {
			this.dragState = null;
			this.marqueeState = null;
			this.snapGuides = [];
			this.stopFollowing();
			this.peerModel = disconnectPeers(this.peerModel);
			this.model = clearPendingMoves(this.model);
		} else {
			this.#sendPresence(undefined, undefined, true);
		}
	};

	#send(message: ClientMessage): boolean {
		return this.#socketController?.send(message) ?? false;
	}

	#sendFrameMove(frameId: FrameId, position: Point, final: boolean): void {
		const sequence = (this.#sequence = nextClientSequence(this.#sequence));
		if (
			this.#send({
				type: 'frame.move',
				seq: sequence,
				frameId,
				x: position.x,
				y: position.y,
				final
			})
		) {
			this.model = markFrameMoveSent(this.model, frameId, sequence);
		}
	}

	#sendFrameMetadata(frameId: FrameId, metadata: Partial<FrameMetadata>): boolean {
		if (!this.editingReady) {
			this.editorNotice = 'Reconnect to change layer settings.';
			return false;
		}
		const message: ClientMessage = {
			type: 'frame.metadata',
			seq: (this.#sequence = nextClientSequence(this.#sequence)),
			frameId,
			...metadata
		};
		return this.#send(message);
	}

	#sendPresence(clientX?: number, clientY?: number, force = false): void {
		if (!this.#viewport || !this.editingReady) return;
		let nextCursor = this.#lastCursor;
		if (clientX !== undefined && clientY !== undefined) {
			const rect = this.#viewport.getBoundingClientRect();
			nextCursor = screenToWorld({ x: clientX - rect.left, y: clientY - rect.top }, this.camera);
		}
		const cursorBecameVisible = this.#lastCursor === null && nextCursor !== null;
		const now = this.#now();
		if (!shouldSendThrottled(now, this.#lastPresenceSent, 50, force || cursorBecameVisible)) return;
		this.#lastCursor = nextCursor;
		this.#send({
			type: 'presence.update',
			seq: (this.#sequence = nextClientSequence(this.#sequence)),
			cursor: this.#lastCursor,
			selectedFrameId: this.selectedFrameId,
			view: this.#currentView()
		});
		this.#lastPresenceSent = now;
	}

	#currentView(): ViewState | null {
		if (!this.#viewport) return null;
		const rect = this.#viewport.getBoundingClientRect();
		return {
			center: screenToWorld({ x: rect.width / 2, y: rect.height / 2 }, this.camera),
			zoom: this.camera.zoom
		};
	}

	#applyFollowView(view: ViewState): void {
		if (!this.#viewport) return;
		const rect = this.#viewport.getBoundingClientRect();
		this.camera = {
			x: rect.width / 2 - view.center.x * view.zoom,
			y: rect.height / 2 - view.center.y * view.zoom,
			zoom: view.zoom
		};
	}

	#frameBounds(): Bounds {
		return boundsForFrames(
			this.visibleFrames.map((frame) => ({
				id: frame.id,
				...this.framePosition(frame.id)
			}))
		);
	}

	#focusBounds(bounds: Bounds, padding = 88): void {
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
		this.#sendPresence(undefined, undefined, true);
	}

	#moveLocally(positions: readonly FramePosition[]): void {
		for (const position of positions) {
			this.model = moveFrameLocally(this.model, position.id, {
				x: position.x,
				y: position.y
			});
		}
	}

	#commitPositions(after: readonly FramePosition[], label: string): void {
		if (!this.editingReady || after.length === 0) return;
		const before = after.map(({ id }) => ({ id, ...this.framePosition(id) }));
		const changed = after.filter((position, index) => {
			const previous = before[index];
			return position.x !== previous.x || position.y !== previous.y;
		});
		if (changed.length === 0) return;
		this.#moveLocally(changed);
		for (const position of changed) this.#sendFrameMove(position.id, position, true);
		this.#recordHistory(
			label,
			before.filter((position) => changed.some(({ id }) => id === position.id)),
			changed
		);
	}

	#recordHistory(
		label: string,
		before: readonly FramePosition[],
		after: readonly FramePosition[]
	): void {
		this.#history = this.#history.slice(0, this.historyIndex);
		this.#history.push({
			label,
			before: before.map((position) => ({ ...position })),
			after: after.map((position) => ({ ...position }))
		});
		this.historyIndex = this.#history.length;
	}

	#applyHistoryPositions(positions: readonly FramePosition[]): void {
		const movable = positions.filter((position) => !this.frameMetadata(position.id).locked);
		this.#moveLocally(movable);
		for (const position of movable) this.#sendFrameMove(position.id, position, true);
	}

	#isTypingTarget(target: EventTarget | null): boolean {
		if (!(target instanceof HTMLElement)) return false;
		return target.matches('input, textarea, select, [contenteditable="true"]');
	}

	#refreshViewportMode = (): void => {
		const width = this.#viewport?.getBoundingClientRect().width ?? globalThis.innerWidth;
		this.mobileViewport = width <= MOBILE_BREAKPOINT;
		if (this.mobileViewport && !this.#didChooseMobileEntry) {
			this.#didChooseMobileEntry = true;
			this.browseOpen = true;
		}
	};
}
