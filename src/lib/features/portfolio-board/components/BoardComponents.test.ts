// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
	buildCanvasDocument,
	getPortfolioContent,
	type CanvasFrame
} from '$lib/features/portfolio-content';

import { PortfolioBoardController, type BoardSocketClient } from '../board-controller.svelte';
import BoardControls from './BoardControls.svelte';
import BoardTopbar from './BoardTopbar.svelte';
import BoardViewport from './BoardViewport.svelte';
import BrowseDialog from './BrowseDialog.svelte';
import LayersPanel from './LayersPanel.svelte';
import ResetDialog from './ResetDialog.svelte';

const content = getPortfolioContent();
const canvasDocument = buildCanvasDocument(content);

function socketStub(): BoardSocketClient {
	return {
		connect: vi.fn(),
		close: vi.fn(),
		send: vi.fn(() => true),
		onMessage: vi.fn(() => vi.fn()),
		onStateChange: vi.fn(() => vi.fn())
	};
}

function createController(options: { fetch?: typeof globalThis.fetch } = {}) {
	return new PortfolioBoardController(canvasDocument, {
		createSocket: socketStub,
		fetch: options.fetch,
		focusFrame: vi.fn(),
		prefersReducedMotion: () => false,
		requestFrame: (callback) => {
			callback(0);
			return 0;
		}
	});
}

afterEach(cleanup);

describe('LayersPanel', () => {
	it('exposes the layer tree and navigates to a selected frame', async () => {
		const controller = createController();
		const goToFrame = vi.spyOn(controller, 'goToFrame');
		const user = userEvent.setup();
		render(LayersPanel, { controller });

		expect(screen.getByRole('navigation', { name: 'Layers' })).toBeInTheDocument();
		const target = controller.frames.find((frame) => frame.kind === 'project');
		if (!target) throw new Error('Expected a project frame in the checked-in canvas document.');

		await user.click(screen.getByRole('button', { name: `Go to ${target.title}` }));

		expect(goToFrame).toHaveBeenCalledWith(target);
		expect(controller.selectedFrameId).toBe(target.id);
	});

	it('collapses and expands from an accurately labelled toggle', async () => {
		const user = userEvent.setup();
		const controller = createController();
		render(LayersPanel, { controller });
		const toggle = screen.getByRole('button', { name: 'Toggle layers' });

		expect(toggle).toHaveAttribute('aria-expanded', 'true');
		await user.click(toggle);

		expect(toggle).toHaveAttribute('aria-expanded', 'false');
		expect(screen.queryByRole('button', { name: /^Go to / })).not.toBeInTheDocument();
	});
});

describe('BoardControls', () => {
	it('provides accessible zoom, fit, and browse commands', async () => {
		const user = userEvent.setup();
		const controller = createController();
		const setZoom = vi.spyOn(controller, 'setZoom');
		const fitSelection = vi.spyOn(controller, 'fitSelection');
		const fitAll = vi.spyOn(controller, 'fitAll');
		render(BoardControls, { controller });

		expect(screen.getByLabelText('Zoom controls')).toBeInTheDocument();
		expect(screen.getByText('78%')).toHaveAttribute('aria-live', 'polite');

		await user.click(screen.getByRole('button', { name: 'Zoom out' }));
		expect(setZoom).toHaveBeenLastCalledWith(0.78 / 1.2);

		await user.click(screen.getByRole('button', { name: 'Zoom in' }));
		expect(setZoom).toHaveBeenLastCalledWith(0.78);

		await user.click(screen.getByRole('button', { name: 'Fit selection' }));
		await user.click(screen.getByRole('button', { name: 'Fit all' }));
		expect(fitSelection).toHaveBeenCalledOnce();
		expect(fitAll).toHaveBeenCalledOnce();

		await user.click(screen.getByRole('button', { name: 'Browse portfolio' }));
		expect(controller.browseOpen).toBe(true);
	});
});

describe('BoardTopbar', () => {
	it.each([
		['offline', 'Offline'],
		['failed', 'Connection failed']
	] as const)('announces the %s connection state', (connectionState, label) => {
		const controller = createController();
		controller.connectionState = connectionState;
		render(BoardTopbar, { content, controller });

		const status = screen.getByRole('status');
		expect(status).toHaveTextContent(label);
		expect(status).toHaveAttribute('data-connection-state', connectionState);
	});

	it('names the primary toolbar controls, collaborators, and resume link', () => {
		const controller = createController();
		render(BoardTopbar, { content, controller });

		expect(screen.getByRole('button', { name: 'Toggle layers' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Open file menu' })).toBeInTheDocument();
		expect(screen.getByRole('group', { name: '0 collaborators' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /resume/i })).toHaveAttribute(
			'href',
			content.site.metadata.resumeUrl
		);
	});
});

describe('BrowseDialog', () => {
	it('opens with an accessible description, contains focus, and closes', async () => {
		const user = userEvent.setup();
		const controller = createController();
		controller.browseOpen = true;
		render(BrowseDialog, { content, controller });

		const dialog = await screen.findByRole('dialog', { name: 'Browse portfolio' });
		expect(dialog).toHaveAccessibleDescription('The same portfolio, arranged for reading.');
		await waitFor(() =>
			expect(dialog).toContainElement(document.activeElement as HTMLElement | null)
		);
		expect(
			within(dialog).getByRole('link', { name: content.site.metadata.contact.email })
		).toHaveAttribute('href', `mailto:${content.site.metadata.contact.email}`);

		await user.click(within(dialog).getByRole('button', { name: 'Close browse mode' }));

		await waitFor(() =>
			expect(screen.queryByRole('dialog', { name: 'Browse portfolio' })).not.toBeInTheDocument()
		);
		expect(controller.browseOpen).toBe(false);
	});
});

describe('ResetDialog', () => {
	it('focuses the owner key, enables confirmation, and clears input when cancelled', async () => {
		const user = userEvent.setup();
		const controller = createController();
		controller.resetDialogOpen = true;
		render(ResetDialog, { controller });

		const dialog = await screen.findByRole('dialog', { name: 'Reset board' });
		const ownerKey = within(dialog).getByLabelText('Owner key');
		await waitFor(() => expect(dialog).toHaveFocus());
		await user.tab();
		expect(ownerKey).toHaveFocus();
		const reset = within(dialog).getByRole('button', { name: 'Reset board' });
		expect(reset).toBeDisabled();

		await user.type(ownerKey, 'correct horse battery staple');
		expect(reset).toBeEnabled();
		await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		expect(controller.ownerKey).toBe('');
		expect(controller.resetError).toBe('');
	});

	it('associates reset failures with the owner-key field', async () => {
		const user = userEvent.setup();
		const fetch = vi
			.fn<typeof globalThis.fetch>()
			.mockResolvedValue(new Response(null, { status: 401 }));
		const controller = createController({ fetch });
		controller.resetDialogOpen = true;
		render(ResetDialog, { controller });
		const ownerKey = await screen.findByLabelText('Owner key');

		await user.type(ownerKey, 'incorrect key');
		await user.click(screen.getByRole('button', { name: 'Reset board' }));

		const alert = await screen.findByRole('alert');
		expect(alert).toHaveTextContent('The owner key was not accepted.');
		expect(ownerKey).toHaveAttribute('aria-invalid', 'true');
		expect(ownerKey).toHaveAccessibleDescription('The owner key was not accepted.');
		expect(fetch).toHaveBeenCalledWith(
			'/api/board/reset',
			expect.objectContaining({ method: 'POST' })
		);
	});
});

type ViewportControllerStub = Pick<
	PortfolioBoardController,
	| 'camera'
	| 'connectionState'
	| 'dragState'
	| 'editingReady'
	| 'framePosition'
	| 'frames'
	| 'goToFrame'
	| 'mount'
	| 'onFramePointerDown'
	| 'onPointerMove'
	| 'onPointerUp'
	| 'onViewportPointerDown'
	| 'onWheel'
	| 'panPointerId'
	| 'peerModel'
	| 'peerScreenPosition'
	| 'reducedMotion'
	| 'selectedFrameId'
>;

function viewportController(
	connectionState: 'offline' | 'failed',
	frame: CanvasFrame = canvasDocument.frames[0]
): PortfolioBoardController {
	const stub: ViewportControllerStub = {
		camera: { x: 0, y: 0, zoom: 1 },
		connectionState,
		dragState: null,
		editingReady: false,
		framePosition: vi.fn(() => ({ x: 10, y: 20 })),
		frames: [frame],
		goToFrame: vi.fn(),
		mount: vi.fn(() => vi.fn()),
		onFramePointerDown: vi.fn(),
		onPointerMove: vi.fn(),
		onPointerUp: vi.fn(),
		onViewportPointerDown: vi.fn(),
		onWheel: vi.fn(),
		panPointerId: null,
		peerModel: { self: null, peers: [] },
		peerScreenPosition: vi.fn(() => ({ x: 0, y: 0 })),
		reducedMotion: false,
		selectedFrameId: null
	};
	return stub as PortfolioBoardController;
}

describe('BoardViewport', () => {
	it.each([
		['offline', 'You’re offline. Browsing is still available.'],
		['failed', 'The live canvas connection failed. Browsing is still available.']
	] as const)('shows the %s editing banner', (connectionState, message) => {
		const controller = viewportController(connectionState);
		render(BoardViewport, { controller });

		expect(screen.getByText(message)).toBeInTheDocument();
		expect(controller.mount).toHaveBeenCalledOnce();
	});

	it('wires pointer and wheel input to the board controller', async () => {
		const controller = viewportController('offline');
		render(BoardViewport, { controller });
		const viewport = screen.getByRole('application', { name: 'Interactive portfolio canvas' });

		await fireEvent.pointerDown(viewport, { pointerId: 1, clientX: 10, clientY: 20 });
		await fireEvent.pointerMove(viewport, { pointerId: 1, clientX: 20, clientY: 30 });
		await fireEvent.pointerUp(viewport, { pointerId: 1, clientX: 20, clientY: 30 });
		await fireEvent.pointerCancel(viewport, { pointerId: 2 });
		await fireEvent.wheel(viewport, { deltaY: 10 });

		expect(controller.onViewportPointerDown).toHaveBeenCalledOnce();
		expect(controller.onPointerMove).toHaveBeenCalledOnce();
		expect(controller.onPointerUp).toHaveBeenCalledTimes(2);
		expect(controller.onWheel).toHaveBeenCalledOnce();
	});
});
