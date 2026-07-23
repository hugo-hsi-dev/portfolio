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

function createHarness(fetchImpl: typeof fetch = vi.fn()) {
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
				right: 1000,
				bottom: 700,
				width: 1000,
				height: 700,
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
			selectedFrameId: null
		};
		socket.emit({ type: 'peer.join', peer });
		socket.emit({
			type: 'peer.update',
			sessionId: peer.sessionId,
			cursor: { x: 10, y: 20 },
			selectedFrameId: 'profile'
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
});
