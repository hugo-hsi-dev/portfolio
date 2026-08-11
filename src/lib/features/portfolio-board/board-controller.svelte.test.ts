// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';

import {
	DEFAULT_FRAME_POSITIONS,
	type ClientMessage,
	type ServerMessage
} from '@portfolio/realtime-contract';

import { buildCanvasDocument, getPortfolioContent } from '$lib/features/portfolio-content';

import { PortfolioBoardController, type BoardSocketClient } from './board-controller.svelte';
import type { ConnectionState } from './realtime/socket';

class FakeSocket implements BoardSocketClient {
	readonly sent: ClientMessage[] = [];
	readonly messageListeners = new Set<(message: ServerMessage) => void>();
	readonly stateListeners = new Set<(state: ConnectionState) => void>();
	connected = false;
	closed = false;

	connect(): void {
		this.connected = true;
		this.emitState('connecting');
	}

	close(): void {
		this.closed = true;
	}

	send(message: ClientMessage): boolean {
		this.sent.push(message);
		return true;
	}

	onMessage(listener: (message: ServerMessage) => void): () => void {
		this.messageListeners.add(listener);
		return () => this.messageListeners.delete(listener);
	}

	onStateChange(listener: (state: ConnectionState) => void): () => void {
		this.stateListeners.add(listener);
		listener('idle');
		return () => this.stateListeners.delete(listener);
	}

	emit(message: ServerMessage): void {
		for (const listener of this.messageListeners) listener(message);
	}

	emitState(state: ConnectionState): void {
		for (const listener of this.stateListeners) listener(state);
	}
}

function snapshot(revision = 1): Extract<ServerMessage, { type: 'room.snapshot' }> {
	return {
		type: 'room.snapshot',
		revision,
		frames: DEFAULT_FRAME_POSITIONS.map((frame) => ({
			...frame,
			visible: true,
			locked: false,
			revision,
			updatedAt: revision,
			updatedBy: null
		})),
		self: {
			sessionId: '25b6c1f8-e09d-4a1d-a790-a85cca7e57d3',
			visitorId: '4b87ff41-92a6-4c72-93cc-ad92b663487c',
			name: 'Guest 1000',
			color: '#abcdef'
		},
		peers: []
	};
}

function createHarness(
	fetchImpl: typeof fetch = vi.fn(),
	viewportSize: { width: number; height: number } = { width: 1000, height: 700 }
) {
	const socket = new FakeSocket();
	const focusedFrames: string[] = [];
	let now = 100;
	const controller = new PortfolioBoardController(buildCanvasDocument(getPortfolioContent()), {
		createSocket: () => socket,
		now: () => now,
		requestFrame: (callback) => {
			callback(0);
			return 1;
		},
		fetch: fetchImpl,
		prefersReducedMotion: () => true,
		focusFrame: (frameId) => focusedFrames.push(frameId)
	});
	const viewport = document.createElement('div');
	Object.defineProperties(viewport, {
		getBoundingClientRect: {
			value: () => ({
				x: 0,
				y: 0,
				top: 0,
				left: 0,
				right: viewportSize.width,
				bottom: viewportSize.height,
				width: viewportSize.width,
				height: viewportSize.height,
				toJSON: () => ({})
			})
		},
		setPointerCapture: { value: vi.fn() }
	});
	viewport.dataset.canvasViewport = '';
	document.body.append(viewport);

	return {
		controller,
		socket,
		viewport,
		focusedFrames,
		advanceNow: (amount: number) => (now += amount),
		cleanup: controller.mount(viewport)
	};
}

function pointerEvent(target: HTMLElement, overrides: Partial<PointerEvent> = {}): PointerEvent {
	return {
		target,
		currentTarget: target,
		pointerId: 1,
		clientX: 100,
		clientY: 120,
		button: 0,
		preventDefault: vi.fn(),
		...overrides
	} as unknown as PointerEvent;
}

describe('PortfolioBoardController', () => {
	it('applies snapshots, peer events, frame updates, resets, and disconnects', () => {
		const harness = createHarness();
		const { controller, socket } = harness;
		expect(socket.connected).toBe(true);
		expect(controller.reducedMotion).toBe(true);
		expect(controller.zoomPercent).toBe(78);
		expect(controller.selectedFrame?.id).toBe('profile');

		socket.emit(snapshot());
		expect(controller.model.hasSnapshot).toBe(true);
		expect(controller.collaborators).toHaveLength(1);

		const peer = {
			sessionId: 'adf73f2f-f2d3-4246-9087-84a46bf665bd',
			visitorId: '2ac3308f-a622-4b9b-9782-981d19ef943c',
			name: 'Guest 2000',
			color: '#0acf83',
			cursor: null,
			selectedFrameId: null,
			view: null
		};
		socket.emit({ type: 'peer.join', peer });
		socket.emit({
			type: 'peer.update',
			sessionId: peer.sessionId,
			cursor: { x: 10, y: 20 },
			selectedFrameId: 'profile',
			view: { center: { x: 400, y: 300 }, zoom: 1.25 }
		});
		expect(controller.peerScreenPosition(controller.peerModel.peers[0])).toEqual(
			expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) })
		);
		socket.emit({ type: 'peer.leave', sessionId: peer.sessionId });
		expect(controller.peerModel.peers).toEqual([]);

		socket.emit({
			type: 'frame.update',
			frame: {
				...snapshot(2).frames[0],
				x: 222,
				y: 333
			},
			sourceSessionId: peer.sessionId,
			clientSeq: 1
		});
		expect(controller.framePosition('profile')).toEqual({ x: 222, y: 333 });

		socket.emit({ type: 'board.reset', revision: 3, frames: snapshot(3).frames });
		expect(controller.dragState).toBeNull();
		socket.emitState('reconnecting');
		expect(controller.editingReady).toBe(false);
		expect(controller.peerModel.peers).toEqual([]);

		harness.cleanup();
		expect(socket.closed).toBe(true);
		expect(socket.messageListeners.size).toBe(0);
		harness.viewport.remove();
	});

	it('handles drag, pan, pinch, wheel, keyboard, focus, and mobile navigation', () => {
		const harness = createHarness();
		const { controller, socket, viewport } = harness;
		socket.emit(snapshot());
		socket.emitState('open');

		const frameElement = document.createElement('article');
		frameElement.dataset.frameId = 'profile';
		Object.defineProperty(frameElement, 'setPointerCapture', { value: vi.fn() });
		viewport.append(frameElement);

		controller.onFramePointerDown(pointerEvent(frameElement), 'profile');
		harness.advanceNow(60);
		controller.onPointerMove(pointerEvent(frameElement, { clientX: 160, clientY: 180 }));
		controller.onPointerUp(pointerEvent(frameElement));
		expect(socket.sent.filter((message) => message.type === 'frame.move').length).toBeGreaterThan(
			0
		);

		controller.onViewportPointerDown(pointerEvent(viewport, { pointerId: 2 }));
		controller.onPointerMove(pointerEvent(viewport, { pointerId: 2, clientX: 130, clientY: 150 }));
		controller.onPointerUp(pointerEvent(viewport, { pointerId: 2 }));

		controller.onViewportPointerDown(pointerEvent(viewport, { pointerId: 3 }));
		controller.onViewportPointerDown(
			pointerEvent(viewport, { pointerId: 4, clientX: 200, clientY: 200 })
		);
		controller.onPointerMove(pointerEvent(viewport, { pointerId: 4, clientX: 240, clientY: 230 }));
		controller.onPointerUp(pointerEvent(viewport, { pointerId: 3 }));
		controller.onPointerUp(pointerEvent(viewport, { pointerId: 4 }));

		const wheelPreventDefault = vi.fn();
		controller.onWheel({
			preventDefault: wheelPreventDefault,
			ctrlKey: true,
			metaKey: false,
			deltaX: 0,
			deltaY: -10,
			clientX: 100,
			clientY: 100
		} as unknown as WheelEvent);
		controller.onWheel({
			preventDefault: wheelPreventDefault,
			ctrlKey: false,
			metaKey: false,
			deltaX: 10,
			deltaY: 20
		} as unknown as WheelEvent);
		expect(wheelPreventDefault).toHaveBeenCalledTimes(2);

		controller.selectedFrameId = 'profile';
		controller.onKeydown({
			key: 'ArrowRight',
			shiftKey: true,
			target: viewport,
			preventDefault: vi.fn()
		} as unknown as KeyboardEvent);
		controller.onKeydown({
			key: 'Escape',
			target: viewport
		} as unknown as KeyboardEvent);
		expect(controller.selectedFrameId).toBeNull();

		controller.fitAll();
		controller.goToFrame(controller.frames[1]);
		expect(harness.focusedFrames).toContain(controller.frames[1].id);
		controller.goToFrameFromMobileLayers(controller.frames[2]);
		const preventAutoFocus = vi.fn();
		controller.onMobileLayersCloseAutoFocus({
			preventDefault: preventAutoFocus
		} as unknown as Event);
		expect(preventAutoFocus).toHaveBeenCalledOnce();
		controller.fitSelection();
		controller.setZoom(999);
		expect(controller.camera.zoom).toBe(4);

		harness.cleanup();
		viewport.remove();
		frameElement.remove();
	});

	it('ignores non-draggable targets and reports reset outcomes', async () => {
		const successFetch = vi.fn(async () => new Response(null, { status: 204 })) as typeof fetch;
		const harness = createHarness(successFetch);
		const { controller, socket, viewport } = harness;
		socket.emit(snapshot());

		const button = document.createElement('button');
		viewport.append(button);
		controller.onFramePointerDown(pointerEvent(button), 'profile');
		expect(controller.dragState).toBeNull();

		controller.ownerKey = 'owner-key';
		await controller.resetBoard();
		expect(successFetch).toHaveBeenCalledWith(
			'/api/board/reset',
			expect.objectContaining({ method: 'POST' })
		);
		expect(controller.ownerKey).toBe('');

		controller.ownerKey = 'clear-me';
		controller.resetError = 'clear-me';
		controller.onResetDialogOpenChange(false);
		expect(controller.ownerKey).toBe('');
		expect(controller.resetError).toBe('');
		controller.onMobileLayersCloseAutoFocus(new Event('close'));

		harness.cleanup();
		viewport.remove();

		const deniedFetch = vi.fn(async () => new Response(null, { status: 401 })) as typeof fetch;
		const denied = createHarness(deniedFetch);
		denied.controller.ownerKey = 'wrong';
		await denied.controller.resetBoard();
		expect(denied.controller.resetError).toBe('The owner key was not accepted.');
		expect(denied.controller.resetPending).toBe(false);
		denied.cleanup();
		denied.viewport.remove();
	});

	it('multi-selects, moves a group, and replays position history', () => {
		const harness = createHarness();
		const { controller, socket, viewport } = harness;
		socket.emit(snapshot());
		socket.emitState('open');
		controller.camera = { x: 0, y: 0, zoom: 1 };
		controller.selectedFrameIds = ['profile', 'contact'];

		const frameElement = document.createElement('article');
		frameElement.dataset.frameId = 'profile';
		Object.defineProperty(frameElement, 'setPointerCapture', { value: vi.fn() });
		viewport.append(frameElement);
		const before = controller.selectedFrameIds.map((id) => ({
			id,
			...controller.framePosition(id)
		}));

		controller.onFramePointerDown(pointerEvent(frameElement), 'profile');
		harness.advanceNow(120);
		controller.onPointerMove(pointerEvent(frameElement, { clientX: 150, clientY: 160 }));
		controller.onPointerUp(pointerEvent(frameElement, { clientX: 150, clientY: 160 }));

		expect(controller.framePosition('profile')).toEqual({ x: 50, y: 40 });
		expect(controller.framePosition('contact')).toEqual({ x: 50, y: 620 });
		expect(controller.canUndo).toBe(true);
		expect(
			socket.sent.filter((message) => message.type === 'frame.move' && message.final)
		).toHaveLength(2);

		controller.undo();
		expect(controller.framePosition('profile')).toEqual({ x: before[0].x, y: before[0].y });
		expect(controller.framePosition('contact')).toEqual({ x: before[1].x, y: before[1].y });
		expect(controller.canRedo).toBe(true);
		controller.redo();
		expect(controller.framePosition('profile')).toEqual({ x: 50, y: 40 });

		harness.cleanup();
		viewport.remove();
	});

	it('commits precise inspector coordinates through realtime and position history', () => {
		const harness = createHarness();
		const { controller, socket, viewport } = harness;
		socket.emit(snapshot());
		socket.emitState('open');
		controller.selectedFrameId = 'profile';
		const before = controller.framePosition('profile');

		controller.setSelectionAxis('x', 137.5);
		controller.setSelectionAxis('y', -42.25);

		expect(controller.framePosition('profile')).toEqual({ x: 137.5, y: -42.25 });
		expect(controller.canUndo).toBe(true);
		expect(socket.sent.filter((message) => message.type === 'frame.move')).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					type: 'frame.move',
					frameId: 'profile',
					x: 137.5,
					y: before.y,
					final: true
				}),
				expect.objectContaining({
					type: 'frame.move',
					frameId: 'profile',
					x: 137.5,
					y: -42.25,
					final: true
				})
			])
		);

		controller.undo();
		expect(controller.framePosition('profile')).toEqual({ x: 137.5, y: before.y });
		controller.undo();
		expect(controller.framePosition('profile')).toEqual(before);

		harness.cleanup();
		viewport.remove();
	});

	it('marquee-selects intersecting visible unlocked frames and supports selection shortcuts', () => {
		const harness = createHarness();
		const { controller, socket, viewport } = harness;
		socket.emit(snapshot());
		socket.emitState('open');
		controller.camera = { x: 0, y: 0, zoom: 1 };

		controller.onViewportPointerDown(
			pointerEvent(viewport, { pointerId: 7, clientX: -10, clientY: -10 })
		);
		controller.onPointerMove(pointerEvent(viewport, { pointerId: 7, clientX: 760, clientY: 500 }));
		expect(controller.selectedFrameIds).toEqual(['profile']);
		expect(controller.marqueeBounds).toEqual({ x: -10, y: -10, width: 770, height: 510 });
		controller.onPointerUp(pointerEvent(viewport, { pointerId: 7, clientX: 760, clientY: 500 }));
		expect(controller.marqueeBounds).toBeNull();

		controller.onKeydown({
			key: 'a',
			metaKey: true,
			target: viewport,
			preventDefault: vi.fn()
		} as unknown as KeyboardEvent);
		expect(controller.selectedFrameIds).toHaveLength(DEFAULT_FRAME_POSITIONS.length);
		controller.onKeydown({ key: 'h', target: viewport } as unknown as KeyboardEvent);
		expect(controller.tool).toBe('hand');
		controller.onKeydown({ key: 'v', target: viewport } as unknown as KeyboardEvent);
		expect(controller.tool).toBe('move');

		harness.cleanup();
		viewport.remove();
	});

	it('uses physical shifted number keys for fit shortcuts', () => {
		const harness = createHarness();
		const { controller, socket, viewport } = harness;
		socket.emit(snapshot());
		const fitAll = vi.spyOn(controller, 'fitAll');
		const fitSelection = vi.spyOn(controller, 'fitSelection');
		const preventFitAll = vi.fn();
		const preventFitSelection = vi.fn();

		controller.onKeydown({
			key: '!',
			code: 'Digit1',
			shiftKey: true,
			target: viewport,
			preventDefault: preventFitAll
		} as unknown as KeyboardEvent);
		controller.onKeydown({
			key: '@',
			code: 'Digit2',
			shiftKey: true,
			target: viewport,
			preventDefault: preventFitSelection
		} as unknown as KeyboardEvent);

		expect(fitAll).toHaveBeenCalledOnce();
		expect(fitSelection).toHaveBeenCalledOnce();
		expect(preventFitAll).toHaveBeenCalledOnce();
		expect(preventFitSelection).toHaveBeenCalledOnce();

		harness.cleanup();
		viewport.remove();
	});

	it('sends authoritative visibility and locking metadata and handles locked move rejection', () => {
		const harness = createHarness();
		const { controller, socket, viewport } = harness;
		socket.emit(snapshot());
		socket.emitState('open');
		controller.selectedFrameId = 'profile';

		controller.toggleFrameVisibility('profile');
		expect(socket.sent.at(-1)).toMatchObject({
			type: 'frame.metadata',
			frameId: 'profile',
			visible: false
		});
		expect(controller.selectedFrameIds).toEqual([]);

		socket.emit({
			type: 'frame.update',
			frame: { ...snapshot(2).frames[0], locked: true },
			sourceSessionId: snapshot().self.sessionId,
			clientSeq: 1
		});
		expect(controller.frameMetadata('profile').locked).toBe(true);
		controller.toggleFrameLock('profile');
		expect(socket.sent.at(-1)).toMatchObject({
			type: 'frame.metadata',
			frameId: 'profile',
			locked: false
		});

		socket.emit({ type: 'error', code: 'frame-locked', message: 'That frame is locked.' });
		expect(controller.dragState).toBeNull();
		expect(controller.editorNotice).toBe('That frame is locked.');

		harness.cleanup();
		viewport.remove();
	});

	it('cancels a local drag when a collaborator hides one of its frames', () => {
		const harness = createHarness();
		const { controller, socket, viewport } = harness;
		socket.emit(snapshot());
		socket.emitState('open');
		controller.camera = { x: 0, y: 0, zoom: 1 };

		const frameElement = document.createElement('article');
		frameElement.dataset.frameId = 'profile';
		Object.defineProperty(frameElement, 'setPointerCapture', { value: vi.fn() });
		viewport.append(frameElement);

		controller.onFramePointerDown(pointerEvent(frameElement), 'profile');
		harness.advanceNow(60);
		controller.onPointerMove(pointerEvent(frameElement, { clientX: 160, clientY: 180 }));
		expect(controller.dragState?.frameIds).toContain('profile');
		controller.snapGuides = [
			{
				orientation: 'vertical',
				position: 160,
				start: 0,
				end: 580,
				targetFrameId: 'contact',
				movingAnchor: 'start',
				targetAnchor: 'start'
			}
		];
		const movesBeforeHide = socket.sent.filter((message) => message.type === 'frame.move');

		socket.emit({
			type: 'frame.update',
			frame: { ...snapshot(2).frames[0], visible: false },
			sourceSessionId: 'adf73f2f-f2d3-4246-9087-84a46bf665bd',
			clientSeq: 1
		});

		expect(controller.selectedFrameIds).not.toContain('profile');
		expect(controller.dragState).toBeNull();
		expect(controller.snapGuides).toEqual([]);

		controller.onPointerMove(pointerEvent(frameElement, { clientX: 220, clientY: 240 }));
		controller.onPointerUp(pointerEvent(frameElement, { clientX: 220, clientY: 240 }));
		expect(socket.sent.filter((message) => message.type === 'frame.move')).toEqual(movesBeforeHide);

		harness.cleanup();
		viewport.remove();
	});

	it('follows collaborator views, stops on local navigation, and opens Browse on mobile', () => {
		const mobile = createHarness(vi.fn(), { width: 390, height: 844 });
		const { controller, socket, viewport } = mobile;
		expect(controller.mobileViewport).toBe(true);
		expect(controller.browseOpen).toBe(true);
		socket.emit(snapshot());
		socket.emitState('open');
		const peer = {
			sessionId: 'adf73f2f-f2d3-4246-9087-84a46bf665bd',
			visitorId: '2ac3308f-a622-4b9b-9782-981d19ef943c',
			name: 'Guest 2000',
			color: '#0acf83',
			cursor: null,
			selectedFrameId: null,
			view: { center: { x: 120, y: 80 }, zoom: 1.5 }
		} as const;
		socket.emit({ type: 'peer.join', peer });

		controller.followCollaborator(peer);
		expect(controller.followingSessionId).toBe(peer.sessionId);
		expect(controller.camera).toEqual({ x: 15, y: 302, zoom: 1.5 });
		controller.setZoom(2);
		expect(controller.followingSessionId).toBeNull();
		expect(socket.sent.find((message) => message.type === 'presence.update')).toMatchObject({
			type: 'presence.update',
			view: expect.objectContaining({ zoom: expect.any(Number) })
		});

		mobile.cleanup();
		viewport.remove();
	});

	it('sends the first real cursor immediately after connection presence', () => {
		const harness = createHarness();
		const { controller, socket, viewport } = harness;
		socket.emit(snapshot());
		socket.emitState('open');
		expect(socket.sent.at(-1)).toMatchObject({ type: 'presence.update', cursor: null });

		controller.onPointerMove(pointerEvent(viewport, { clientX: 620, clientY: 420 }));

		expect(socket.sent.at(-1)).toMatchObject({
			type: 'presence.update',
			cursor: expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) })
		});
		expect(socket.sent.filter((message) => message.type === 'presence.update')).toHaveLength(2);

		harness.cleanup();
		viewport.remove();
	});
});
