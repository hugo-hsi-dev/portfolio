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
import PropertiesPanel from './PropertiesPanel.svelte';
import ResetDialog from './ResetDialog.svelte';
import ShortcutDialog from './ShortcutDialog.svelte';

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

	it('supports additive selection, hover highlighting, visibility, and locking actions', async () => {
		const controller = createController();
		controller.connectionState = 'open';
		const toggleVisibility = vi.spyOn(controller, 'toggleFrameVisibility');
		const toggleLock = vi.spyOn(controller, 'toggleFrameLock');
		render(LayersPanel, { controller });
		const target = controller.frames[1];
		const layer = screen.getByRole('group', { name: `${target.title} layer` });

		await fireEvent.pointerEnter(layer);
		expect(controller.hoveredFrameId).toBe(target.id);
		await fireEvent.click(within(layer).getByRole('button', { name: `Select ${target.title}` }), {
			shiftKey: true
		});
		expect(controller.selectedFrameIds).toEqual(['profile', target.id]);
		await fireEvent.click(within(layer).getByRole('button', { name: `Hide ${target.title}` }));
		await fireEvent.click(within(layer).getByRole('button', { name: `Lock ${target.title}` }));
		expect(toggleVisibility).toHaveBeenCalledWith(target.id);
		expect(toggleLock).toHaveBeenCalledWith(target.id);
		await fireEvent.pointerLeave(layer);
		expect(controller.hoveredFrameId).toBeNull();
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

	it('offers collaborator following and Browse from the primary shell', async () => {
		const controller = createController();
		const peer = {
			sessionId: 'adf73f2f-f2d3-4246-9087-84a46bf665bd',
			visitorId: '2ac3308f-a622-4b9b-9782-981d19ef943c',
			name: 'Guest 2000',
			color: '#0acf83',
			cursor: null,
			selectedFrameId: null,
			view: { center: { x: 0, y: 0 }, zoom: 1 }
		} as const;
		controller.peerModel = { self: null, peers: [peer] };
		const follow = vi.spyOn(controller, 'followCollaborator');
		const user = userEvent.setup();
		render(BoardTopbar, { content, controller });

		await user.click(screen.getByRole('button', { name: `Follow ${peer.name}` }));
		expect(follow).toHaveBeenCalledWith(peer);
		await user.click(screen.getByRole('button', { name: 'Browse portfolio' }));
		expect(controller.browseOpen).toBe(true);
	});
});

describe('BrowseDialog', () => {
	it('opens with an accessible description, contains focus, and closes', async () => {
		const user = userEvent.setup();
		const controller = createController();
		controller.browseOpen = true;
		render(BrowseDialog, { content, controller });

		const dialog = await screen.findByRole('dialog', { name: 'Browse portfolio' });
		expect(dialog).toHaveAccessibleDescription('The same work, arranged for reading.');
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

describe('PropertiesPanel', () => {
	it('exposes contextual geometry, alignment, layer metadata, and collapse controls', async () => {
		const controller = createController();
		controller.connectionState = 'open';
		controller.selectedFrameIds = ['profile', 'contact'];
		const align = vi.spyOn(controller, 'alignSelection');
		const hide = vi.spyOn(controller, 'toggleSelectionVisibility');
		render(PropertiesPanel, { controller });

		expect(screen.getByRole('complementary', { name: 'Design properties' })).toBeInTheDocument();
		expect(screen.getByText('2 frames selected')).toBeInTheDocument();
		expect(screen.getByRole('spinbutton', { name: 'Selection width' })).toHaveValue(720);
		const alignLeft = screen.getByRole('button', { name: 'Align left' });
		expect(alignLeft).toBeEnabled();
		await fireEvent.click(alignLeft);
		expect(align).toHaveBeenCalledWith('left');
		await fireEvent.click(screen.getByRole('button', { name: 'Hide' }));
		expect(hide).toHaveBeenCalledOnce();
		await fireEvent.click(screen.getByRole('button', { name: 'Collapse properties' }));
		expect(controller.propertiesOpen).toBe(false);
		expect(screen.getByRole('button', { name: 'Expand properties' })).toBeInTheDocument();
	});

	it('commits exact X and Y coordinates on Enter or blur and reconciles after undo', async () => {
		const user = userEvent.setup();
		const controller = createController();
		controller.connectionState = 'open';
		controller.selectedFrameId = 'profile';
		const before = controller.framePosition('profile');
		render(PropertiesPanel, { controller });

		const x = screen.getByRole('spinbutton', { name: 'X' });
		await user.clear(x);
		await user.type(x, '137.5');
		await user.keyboard('{Enter}');

		expect(controller.framePosition('profile')).toEqual({ x: 137.5, y: before.y });
		expect(x).toHaveValue(137.5);
		expect(x).toHaveFocus();
		expect(controller.canUndo).toBe(true);

		const y = screen.getByRole('spinbutton', { name: 'Y' });
		await user.clear(y);
		await user.type(y, '-42.25');
		await user.tab();

		expect(controller.framePosition('profile')).toEqual({ x: 137.5, y: -42.25 });
		expect(y).toHaveValue(-42.25);

		controller.undo();
		await waitFor(() => expect(y).toHaveValue(before.y));
		controller.undo();
		await waitFor(() => expect(x).toHaveValue(before.x));
	});
});

describe('ShortcutDialog', () => {
	it('documents the implemented keyboard model and closes accessibly', async () => {
		const controller = createController();
		controller.shortcutDialogOpen = true;
		const user = userEvent.setup();
		render(ShortcutDialog, { controller });
		const dialog = await screen.findByRole('dialog', { name: 'Keyboard shortcuts' });
		expect(dialog).toHaveAccessibleDescription('Move through Hugo’s portfolio like a design file.');
		expect(within(dialog).getByText('Hide or show selection')).toBeInTheDocument();
		await user.click(within(dialog).getByRole('button', { name: 'Close keyboard shortcuts' }));
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
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
