<script lang="ts">
	import {
		BriefcaseBusiness,
		ChevronDown,
		ExternalLink,
		FileText,
		Focus,
		GraduationCap,
		Layers3,
		List,
		Mail,
		Menu,
		Minus,
		Plus,
		RotateCcw,
		Scan,
		Sparkles,
		UserRound,
		UsersRound,
		X
	} from '@lucide/svelte';
	import { Dialog, DropdownMenu } from 'bits-ui';
	import { onMount } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import BrandIcon from '$lib/components/BrandIcon.svelte';
	import CanvasFrame from '$lib/components/canvas/CanvasFrame.svelte';
	import MultiplayerCursor from '$lib/components/canvas/MultiplayerCursor.svelte';
	import {
		BoardSocketController,
		boardStateFromSnapshot,
		boundsForFrames,
		cameraForBounds,
		clampZoom,
		createBoardWebSocketUrl,
		DEFAULT_FRAME_POSITIONS,
		FRAME_DEFINITIONS,
		isArrowKey,
		nudgeFramePosition,
		panCamera,
		reconcileBoardState,
		resolveGestureMode,
		screenToWorld,
		WORLD_COORDINATE_LIMIT,
		visitorIdSchema,
		worldToScreen,
		zoomCameraAt,
		type BoardState,
		type Camera,
		type ClientMessage,
		type ConnectionState,
		type FrameDefinition,
		type FrameId,
		type Identity,
		type PeerState,
		type Point,
		type ServerMessage
	} from '$lib/realtime';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	type DragState = {
		frameId: FrameId;
		pointerId: number;
		startClient: Point;
		startFrame: Point;
	};

	const frames = FRAME_DEFINITIONS;
	const canonicalPositions = Object.fromEntries(
		DEFAULT_FRAME_POSITIONS.map(({ id, x, y }) => [id, { x, y }])
	) as Record<FrameId, Point>;
	const frameLabels: Record<FrameDefinition['kind'], string> = {
		profile: 'Profile',
		contact: 'Contact',
		project: 'Project',
		experience: 'Experience',
		education: 'Education',
		technologies: 'Skills'
	};
	const technologyCategories = [
		{ key: 'frontend', label: 'Frontend' },
		{ key: 'backend', label: 'Backend' },
		{ key: 'database', label: 'Database' },
		{ key: 'tools', label: 'Tools' }
	] as const;
	const connectionLabels: Record<string, string> = {
		idle: 'Preparing live canvas',
		connecting: 'Connecting',
		open: 'Live',
		reconnecting: 'Reconnecting',
		offline: 'Offline',
		closed: 'Offline'
	};

	let viewport: HTMLDivElement;
	let boardState = $state<BoardState | null>(null);
	let positions = $state<Record<FrameId, Point>>(structuredClone(canonicalPositions));
	let camera = $state<Camera>({ x: 72, y: 104, zoom: 0.78 });
	let selectedFrameId = $state<FrameId | null>('profile');
	let dragState = $state<DragState | null>(null);
	let panPointerId = $state<number | null>(null);
	let panLastPoint = $state<Point | null>(null);
	let connectionState = $state<ConnectionState>('connecting');
	let peers = $state<PeerState[]>([]);
	let selfPeer = $state<Identity | null>(null);
	let layersOpen = $state(true);
	let mobileLayersOpen = $state(false);
	let mobileLayerDestination = $state<FrameId | null>(null);
	let browseOpen = $state(false);
	let resetDialogOpen = $state(false);
	let ownerKey = $state('');
	let resetError = $state('');
	let resetPending = $state(false);
	let reducedMotion = $state(false);
	let sequence = 0;
	let socketController: BoardSocketController | null = null;
	let lastPresenceSent = 0;
	let lastFrameSent = 0;
	let didInitialFocus = false;
	const activePointers = new SvelteMap<number, Point>();
	let pinchStart: { distance: number; camera: Camera; center: Point } | null = null;
	const latestMoveSequences = new SvelteMap<FrameId, number>();

	let selectedFrame = $derived(frames.find((frame) => frame.id === selectedFrameId) ?? null);
	let zoomPercent = $derived(Math.round(camera.zoom * 100));
	let editingReady = $derived(connectionState === 'open');
	let collaborators = $derived(selfPeer ? [selfPeer, ...peers] : peers);
	let socialImageUrl = $derived(
		new URL(data.site.metadata.seo.image, data.site.metadata.seo.canonicalUrl).href
	);
	let structuredDataJson = $derived.by(() => {
		const site = data.site.metadata;
		const sameAs = [site.contact.github, site.contact.linkedin].filter((value): value is string =>
			Boolean(value)
		);
		const knowsAbout = Array.from(
			new Set(technologyCategories.flatMap((category) => data.technologies.metadata[category.key]))
		);
		return JSON.stringify({
			'@context': 'https://schema.org',
			'@graph': [
				{
					'@type': 'Person',
					name: `${site.hero.firstName} ${site.hero.lastName}`,
					jobTitle: site.seo.jobTitle,
					email: site.contact.email,
					url: site.seo.canonicalUrl,
					sameAs,
					knowsAbout
				},
				{
					'@type': 'WebSite',
					name: `${site.hero.firstName} ${site.hero.lastName} Portfolio`,
					url: site.seo.canonicalUrl,
					description: site.seo.description
				},
				{
					'@type': 'ItemList',
					name: 'Selected Projects',
					itemListElement: data.projects.map((project, index) => ({
						'@type': 'ListItem',
						position: index + 1,
						item: {
							'@type': 'CreativeWork',
							name: project.metadata.title,
							description: project.metadata.excerpt,
							url: project.metadata.liveUrl,
							keywords: project.metadata.technologies
						}
					}))
				}
			]
		}).replaceAll('<', '\\u003c');
	});

	function worldPoint(clientX: number, clientY: number) {
		const rect = viewport.getBoundingClientRect();
		return screenToWorld({ x: clientX - rect.left, y: clientY - rect.top }, camera);
	}

	function send(message: ClientMessage) {
		return socketController?.send(message) ?? false;
	}

	function sendFrameMove(frameId: FrameId, position: Point, final: boolean) {
		const seq = ++sequence;
		if (send({ type: 'frame.move', seq, frameId, ...position, final })) {
			latestMoveSequences.set(frameId, seq);
		}
	}

	function clampCoordinate(value: number) {
		return Math.max(-WORLD_COORDINATE_LIMIT, Math.min(WORLD_COORDINATE_LIMIT, value));
	}

	function markdownBullets(body: string) {
		return body
			.split('\n')
			.map((line) => line.replace(/^\s*-\s*/, '').trim())
			.filter(Boolean);
	}

	function getVisitorId() {
		const key = 'portfolio-visitor-id';
		try {
			const storedVisitorId = visitorIdSchema.safeParse(localStorage.getItem(key));
			if (storedVisitorId.success) return storedVisitorId.data;
			const visitorId = crypto.randomUUID();
			localStorage.setItem(key, visitorId);
			return visitorId;
		} catch {
			return crypto.randomUUID();
		}
	}

	function handleServerMessage(message: ServerMessage) {
		if (message.type === 'room.snapshot') {
			latestMoveSequences.clear();
			boardState = boardStateFromSnapshot(message);
			const next = { ...positions };
			for (const frame of message.frames) next[frame.id] = { x: frame.x, y: frame.y };
			positions = next;
			selfPeer = message.self;
			peers = message.peers;
			if (!didInitialFocus) {
				didInitialFocus = true;
				requestAnimationFrame(() => {
					const profile = frames[0];
					focusBounds({ ...next.profile, width: profile.width, height: profile.height }, 110);
				});
			}
		} else if (message.type === 'peer.join') {
			peers = [...peers.filter((peer) => peer.sessionId !== message.peer.sessionId), message.peer];
		} else if (message.type === 'peer.leave') {
			peers = peers.filter((peer) => peer.sessionId !== message.sessionId);
		} else if (message.type === 'peer.update') {
			peers = peers.map((peer) =>
				peer.sessionId === message.sessionId
					? {
							...peer,
							cursor: message.cursor,
							selectedFrameId: message.selectedFrameId
						}
					: peer
			);
		} else if (message.type === 'frame.update') {
			if (!boardState) return;
			const nextBoardState = reconcileBoardState(boardState, message);
			if (nextBoardState === boardState) return;
			boardState = nextBoardState;
			const latestMoveSequence = latestMoveSequences.get(message.frame.id);
			const isLatestLocalMove =
				message.sourceSessionId === selfPeer?.sessionId && message.clientSeq === latestMoveSequence;
			if (
				(!dragState || dragState.frameId !== message.frame.id) &&
				(latestMoveSequence === undefined || isLatestLocalMove)
			) {
				positions = {
					...positions,
					[message.frame.id]: { x: message.frame.x, y: message.frame.y }
				};
			}
			if (isLatestLocalMove) latestMoveSequences.delete(message.frame.id);
		} else if (message.type === 'board.reset') {
			if (!boardState) return;
			const nextBoardState = reconcileBoardState(boardState, message);
			if (nextBoardState === boardState) return;
			boardState = nextBoardState;
			latestMoveSequences.clear();
			dragState = null;
			const next = { ...canonicalPositions };
			for (const frame of message.frames) next[frame.id] = { x: frame.x, y: frame.y };
			positions = next;
			fitAll();
		}
	}

	function onFramePointerDown(event: PointerEvent, frameId: FrameId) {
		if ((event.target as HTMLElement).closest('a, button, input, textarea, select')) return;
		selectedFrameId = frameId;
		sendPresence(event.clientX, event.clientY, true);
		if (!editingReady || event.button !== 0) return;
		const position = positions[frameId];
		if (!position) return;
		event.preventDefault();
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
		dragState = {
			frameId,
			pointerId: event.pointerId,
			startClient: { x: event.clientX, y: event.clientY },
			startFrame: { ...position }
		};
	}

	function onViewportPointerDown(event: PointerEvent) {
		viewport.focus({ preventScroll: true });
		activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
		if ((event.target as HTMLElement).closest('[data-frame-id], button, a, input')) return;
		selectedFrameId = null;
		if (event.button !== 0) return;
		viewport.setPointerCapture(event.pointerId);
		panPointerId = event.pointerId;
		panLastPoint = { x: event.clientX, y: event.clientY };
	}

	function onPointerMove(event: PointerEvent) {
		activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
		const gesture = resolveGestureMode(
			activePointers.size,
			dragState?.pointerId === event.pointerId,
			panPointerId === event.pointerId && panLastPoint !== null
		);
		if (gesture === 'pinch') {
			panPointerId = null;
			panLastPoint = null;
			dragState = null;
			const [a, b] = [...activePointers.values()];
			const distance = Math.hypot(a.x - b.x, a.y - b.y);
			const center = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
			if (!pinchStart) pinchStart = { distance, camera: { ...camera }, center };
			const ratio = distance / Math.max(pinchStart.distance, 1);
			const rect = viewport.getBoundingClientRect();
			const startCenter = {
				x: pinchStart.center.x - rect.left,
				y: pinchStart.center.y - rect.top
			};
			const currentCenter = { x: center.x - rect.left, y: center.y - rect.top };
			const zoomedCamera = zoomCameraAt(
				pinchStart.camera,
				startCenter,
				pinchStart.camera.zoom * ratio
			);
			camera = panCamera(zoomedCamera, {
				x: currentCenter.x - startCenter.x,
				y: currentCenter.y - startCenter.y
			});
			return;
		}

		if (gesture === 'drag' && dragState) {
			const dx = (event.clientX - dragState.startClient.x) / camera.zoom;
			const dy = (event.clientY - dragState.startClient.y) / camera.zoom;
			const next = {
				x: clampCoordinate(dragState.startFrame.x + dx),
				y: clampCoordinate(dragState.startFrame.y + dy)
			};
			positions = { ...positions, [dragState.frameId]: next };
			const now = performance.now();
			if (now - lastFrameSent >= 50) {
				sendFrameMove(dragState.frameId, next, false);
				lastFrameSent = now;
			}
			sendPresence(event.clientX, event.clientY);
			return;
		}

		if (gesture === 'pan' && panLastPoint) {
			camera = panCamera(camera, {
				x: event.clientX - panLastPoint.x,
				y: event.clientY - panLastPoint.y
			});
			panLastPoint = { x: event.clientX, y: event.clientY };
		}
		sendPresence(event.clientX, event.clientY);
	}

	function onPointerUp(event: PointerEvent) {
		activePointers.delete(event.pointerId);
		if (activePointers.size < 2) pinchStart = null;
		if (dragState?.pointerId === event.pointerId) {
			const frameId = dragState.frameId;
			const position = positions[frameId];
			if (position) {
				sendFrameMove(frameId, position, true);
			}
			dragState = null;
		}
		if (panPointerId === event.pointerId) {
			panPointerId = null;
			panLastPoint = null;
		}
	}

	function sendPresence(clientX: number, clientY: number, force = false) {
		if (!viewport || !editingReady) return;
		const now = performance.now();
		if (!force && now - lastPresenceSent < 50) return;
		const cursor = worldPoint(clientX, clientY);
		send({
			type: 'presence.update',
			seq: ++sequence,
			cursor,
			selectedFrameId
		});
		lastPresenceSent = now;
	}

	function onWheel(event: WheelEvent) {
		event.preventDefault();
		if (event.ctrlKey || event.metaKey) {
			setZoom(camera.zoom * Math.exp(-event.deltaY * 0.006), event.clientX, event.clientY);
		} else {
			camera = panCamera(camera, { x: -event.deltaX, y: -event.deltaY });
		}
	}

	function setZoom(nextZoom: number, clientX?: number, clientY?: number, baseCamera = camera) {
		if (!viewport) {
			camera = { ...baseCamera, zoom: clampZoom(nextZoom) };
			return;
		}
		const rect = viewport.getBoundingClientRect();
		const anchorX = (clientX ?? rect.left + rect.width / 2) - rect.left;
		const anchorY = (clientY ?? rect.top + rect.height / 2) - rect.top;
		camera = zoomCameraAt(baseCamera, { x: anchorX, y: anchorY }, nextZoom);
	}

	function frameBounds(frameList = frames) {
		return boundsForFrames(
			frameList.map((frame) => ({ id: frame.id, ...(positions[frame.id] ?? frame) }))
		);
	}

	function focusBounds(
		bounds: { x: number; y: number; width: number; height: number },
		padding = 88
	) {
		if (!viewport) return;
		const rect = viewport.getBoundingClientRect();
		const adaptivePadding = Math.min(
			padding,
			Math.max(20, Math.min(rect.width, rect.height) * 0.1)
		);
		camera = cameraForBounds(
			bounds,
			{ width: rect.width, height: rect.height },
			adaptivePadding,
			2
		);
	}

	function fitAll() {
		focusBounds(frameBounds(), 64);
	}

	function fitSelection() {
		if (!selectedFrame) return;
		const position = positions[selectedFrame.id] ?? selectedFrame;
		focusBounds({ ...position, width: selectedFrame.width, height: selectedFrame.height }, 96);
	}

	function goToFrame(frame: FrameDefinition) {
		selectedFrameId = frame.id;
		const position = positions[frame.id] ?? frame;
		focusBounds({ ...position, width: frame.width, height: frame.height }, 96);
		mobileLayersOpen = false;
		requestAnimationFrame(() => {
			document.querySelector<HTMLElement>(`[data-frame-id="${frame.id}"]`)?.focus();
		});
	}

	function goToFrameFromMobileLayers(frame: FrameDefinition) {
		mobileLayerDestination = frame.id;
		goToFrame(frame);
	}

	function onMobileLayersCloseAutoFocus(event: Event) {
		if (!mobileLayerDestination) return;
		event.preventDefault();
		const destination = mobileLayerDestination;
		mobileLayerDestination = null;
		requestAnimationFrame(() => {
			document.querySelector<HTMLElement>(`[data-frame-id="${destination}"]`)?.focus();
		});
	}

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			if (mobileLayersOpen || browseOpen || resetDialogOpen) return;
			selectedFrameId = null;
			return;
		}
		if (!selectedFrameId || !editingReady || !isArrowKey(event.key)) return;
		const target = event.target as HTMLElement;
		if (!target.matches('[data-canvas-viewport], [data-frame-id]')) return;
		event.preventDefault();
		const position = positions[selectedFrameId];
		if (!position) return;
		const next = nudgeFramePosition(position, event.key, event.shiftKey);
		positions = { ...positions, [selectedFrameId]: next };
		sendFrameMove(selectedFrameId, next, true);
	}

	async function resetBoard() {
		resetPending = true;
		resetError = '';
		try {
			const response = await fetch('/api/board/reset', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ token: ownerKey })
			});
			if (!response.ok) {
				throw new Error(
					response.status === 401
						? 'The owner key was not accepted.'
						: 'The board could not be reset.'
				);
			}
			ownerKey = '';
			resetDialogOpen = false;
		} catch (error) {
			resetError = error instanceof Error ? error.message : 'The board could not be reset.';
		} finally {
			resetPending = false;
		}
	}

	function formatDate(value: string, precision: 'month' | 'year' | undefined) {
		return new Intl.DateTimeFormat('en-US', {
			timeZone: 'UTC',
			year: 'numeric',
			...(precision === 'year' ? {} : { month: 'short' })
		}).format(new Date(value));
	}

	onMount(() => {
		reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		socketController = new BoardSocketController({
			url: () => createBoardWebSocketUrl(getVisitorId())
		});
		const removeMessageListener = socketController.onMessage(handleServerMessage);
		const removeStateListener = socketController.onStateChange((state) => {
			connectionState = state;
			if (state !== 'open') {
				dragState = null;
				peers = [];
			}
		});
		socketController.connect();
		return () => {
			removeMessageListener();
			removeStateListener();
			socketController?.close();
		};
	});
</script>

<svelte:head>
	<title>{data.site.metadata.seo.title}</title>
	<meta name="description" content={data.site.metadata.seo.description} />
	<meta
		name="author"
		content={`${data.site.metadata.hero.firstName} ${data.site.metadata.hero.lastName}`}
	/>
	<meta name="keywords" content={data.site.metadata.seo.keywords.join(', ')} />
	<meta name="robots" content="index, follow, max-image-preview:large" />
	<meta name="theme-color" content={data.site.metadata.seo.themeColor} />
	<link rel="canonical" href={data.site.metadata.seo.canonicalUrl} />
	<meta property="og:type" content="website" />
	<meta property="og:locale" content="en_US" />
	<meta property="og:site_name" content="Hugo Hsi Portfolio" />
	<meta property="og:title" content={data.site.metadata.seo.title} />
	<meta property="og:description" content={data.site.metadata.seo.description} />
	<meta property="og:url" content={data.site.metadata.seo.canonicalUrl} />
	<meta property="og:image" content={socialImageUrl} />
	<meta property="og:image:alt" content={data.site.metadata.seo.imageAlt} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={data.site.metadata.seo.title} />
	<meta name="twitter:description" content={data.site.metadata.seo.description} />
	<meta name="twitter:image" content={socialImageUrl} />
	<!-- prettier-ignore -->
	<script type="application/ld+json">
{@html structuredDataJson}
	</script>
</svelte:head>

<svelte:window onkeydown={onKeydown} />

<a class="skip-link" href="#main">Skip to portfolio content</a>

<main class="portfolio-file" id="main" tabindex="-1">
	<header class="topbar">
		<div class="topbar__left">
			<Dialog.Root bind:open={mobileLayersOpen}>
				<Dialog.Trigger class="tool-button mobile-layers-toggle" aria-label="Toggle layers">
					<Menu size={17} />
				</Dialog.Trigger>
				<Dialog.Portal>
					<Dialog.Overlay class="mobile-layer-backdrop" />
					<Dialog.Content class="mobile-layers" onCloseAutoFocus={onMobileLayersCloseAutoFocus}>
						<Dialog.Title class="sr-only">Layers</Dialog.Title>
						<Dialog.Description class="sr-only">
							Choose a portfolio frame to select and center it on the canvas.
						</Dialog.Description>
						<nav id="mobile-layers" aria-label="Layers">
							<div class="panel-heading">
								<span>Layers</span>
								<Dialog.Close class="mobile-layers-close" aria-label="Close layers">
									<X size={16} />
								</Dialog.Close>
							</div>
							{#each frames as frame (frame.id)}
								<button
									type="button"
									class={['layer-row', selectedFrameId === frame.id && 'is-selected']}
									aria-label={`Go to ${frame.title}`}
									onclick={() => goToFrameFromMobileLayers(frame)}
								>
									<FileText size={14} /><span>{frame.title}</span>
								</button>
							{/each}
						</nav>
					</Dialog.Content>
				</Dialog.Portal>
			</Dialog.Root>

			<DropdownMenu.Root>
				<DropdownMenu.Trigger class="file-trigger" aria-label="Open file menu">
					<span class="file-mark">H</span>
					<span class="file-trigger__name">Hugo Hsi — Portfolio</span>
					<ChevronDown size={14} />
				</DropdownMenu.Trigger>
				<DropdownMenu.Portal>
					<DropdownMenu.Content class="file-menu" sideOffset={6} align="start">
						<DropdownMenu.Item class="file-menu__item" onSelect={() => fitAll()}>
							<Scan size={15} /> Fit all
						</DropdownMenu.Item>
						<DropdownMenu.Item class="file-menu__item" onSelect={() => (browseOpen = true)}>
							<List size={15} /> Browse portfolio
						</DropdownMenu.Item>
						<DropdownMenu.Separator class="file-menu__separator" />
						<DropdownMenu.Item
							class="file-menu__item file-menu__item--danger"
							onSelect={() => (resetDialogOpen = true)}
						>
							<RotateCcw size={15} /> Reset board
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Portal>
			</DropdownMenu.Root>
		</div>

		<div class="topbar__center" aria-label="Canvas tools">
			<div class="tool-button is-active" aria-hidden="true"><UserRound size={16} /></div>
			<span class="tool-divider"></span>
			<span class="tool-hint">Drag frames · scroll to pan · pinch to zoom</span>
		</div>

		<div class="topbar__right">
			<div class="collaborators" aria-label={`${collaborators.length} collaborators`}>
				{#each collaborators.slice(0, 4) as collaborator (collaborator.sessionId)}
					<span
						class="collaborator-avatar"
						style:background={collaborator.color}
						title={collaborator.name}
						aria-label={collaborator.name}>{collaborator.name.slice(0, 1)}</span
					>
				{/each}
			</div>
			<span
				class={['connection-status', `is-${connectionState}`]}
				role="status"
				data-connection-state={connectionState}
			>
				<span class="connection-dot"></span>{connectionLabels[connectionState] ?? connectionState}
			</span>
			{#if data.site.metadata.resumeUrl}
				<a
					class="resume-button"
					href={data.site.metadata.resumeUrl}
					target="_blank"
					rel="noopener noreferrer"
				>
					Resume <ExternalLink size={13} />
				</a>
			{/if}
		</div>
	</header>

	<div class="workspace">
		<nav class={['layers-panel', !layersOpen && 'is-collapsed']} aria-label="Layers">
			<div class="panel-heading">
				<span>Layers</span>
				<button
					type="button"
					aria-label="Toggle layers"
					aria-expanded={layersOpen}
					onclick={() => (layersOpen = !layersOpen)}
				>
					{#if layersOpen}<X size={15} />{:else}<Layers3 size={16} />{/if}
				</button>
			</div>
			{#if layersOpen}
				<div class="layer-tree">
					{#each frames as frame (frame.id)}
						<button
							type="button"
							class={['layer-row', selectedFrameId === frame.id && 'is-selected']}
							aria-label={`Go to ${frame.title}`}
							onclick={() => goToFrame(frame)}
						>
							{#if frame.kind === 'project'}<BriefcaseBusiness size={14} />
							{:else if frame.kind === 'education'}<GraduationCap size={14} />
							{:else if frame.kind === 'technologies'}<Sparkles size={14} />
							{:else}<FileText size={14} />{/if}
							<span>{frame.title}</span>
						</button>
					{/each}
				</div>
			{/if}
		</nav>

		<div
			class={['canvas-viewport', panPointerId !== null && 'is-panning']}
			bind:this={viewport}
			data-canvas-viewport
			role="application"
			aria-label="Interactive portfolio canvas"
			tabindex="-1"
			onpointerdown={onViewportPointerDown}
			onpointermove={onPointerMove}
			onpointerup={onPointerUp}
			onpointercancel={onPointerUp}
			onwheel={onWheel}
		>
			<div class="canvas-grid" aria-hidden="true"></div>
			<div
				class="canvas-world"
				data-canvas-world
				style:transform={`translate3d(${camera.x}px, ${camera.y}px, 0) scale(${camera.zoom})`}
			>
				{#each frames as frame (frame.id)}
					{@const position = positions[frame.id] ?? frame}
					<CanvasFrame
						id={frame.id}
						label={frameLabels[frame.kind]}
						title={frame.title}
						x={position.x}
						y={position.y}
						width={frame.width}
						height={frame.height}
						selected={selectedFrameId === frame.id}
						dragging={dragState?.frameId === frame.id}
						onfocus={() => (selectedFrameId = frame.id)}
						onpointerdown={(event) => onFramePointerDown(event, frame.id)}
					>
						{#if frame.kind === 'profile'}
							<section class="profile-frame">
								<div class="profile-kicker"><span></span> Full-stack developer · NYC</div>
								<h1>{data.site.metadata.hero.firstName}<br />{data.site.metadata.hero.lastName}</h1>
								<p class="profile-tagline">{data.site.metadata.hero.tagline}</p>
								<p class="profile-intro">{data.site.metadata.hero.intro}</p>
								<div class="profile-actions">
									<button
										type="button"
										onclick={() =>
											goToFrame(frames.find((item) => item.kind === 'project') ?? frames[0])}
										>{data.site.metadata.hero.ctaPrimary.text}</button
									>
									{#if data.site.metadata.resumeUrl}
										<a href={data.site.metadata.resumeUrl} target="_blank" rel="noopener noreferrer"
											>{data.site.metadata.hero.ctaSecondary?.text ?? 'View resume'}</a
										>
									{:else}
										<a href={`mailto:${data.site.metadata.contact.email}`}>Start a conversation</a>
									{/if}
								</div>
							</section>
						{:else if frame.kind === 'contact'}
							<section class="contact-frame">
								<div class="frame-eyebrow"><UsersRound size={14} /> Open to opportunities</div>
								<h2>{data.site.metadata.footer.heading}</h2>
								<p>{data.site.metadata.footer.intro}</p>
								<a class="email-card" href={`mailto:${data.site.metadata.contact.email}`}>
									<Mail size={18} /><span
										>Email me<small>{data.site.metadata.contact.email}</small></span
									><ExternalLink size={15} />
								</a>
								<div class="contact-links">
									{#if data.site.metadata.contact.github}<a
											href={data.site.metadata.contact.github}
											target="_blank"
											rel="noopener noreferrer"><BrandIcon name="github" /> GitHub</a
										>{/if}
									{#if data.site.metadata.contact.linkedin}<a
											href={data.site.metadata.contact.linkedin}
											target="_blank"
											rel="noopener noreferrer"><BrandIcon name="linkedin" /> LinkedIn</a
										>{/if}
								</div>
							</section>
						{:else if frame.kind === 'project'}
							{@const project = data.projects.find((item) => item.slug === frame.contentSlug)!}
							<article class="project-frame">
								{#if project.metadata.featuredImage}
									<div class="project-image">
										<img
											src={project.metadata.featuredImage}
											alt={project.metadata.featuredImageAlt ?? ''}
											draggable="false"
										/>
									</div>
								{:else}
									<div class="project-image project-image--generated" aria-hidden="true">
										<span>$</span><span>remaining</span><strong>42%</strong>
									</div>
								{/if}
								<div class="project-copy">
									<div class="project-meta">
										<span
											>{project.metadata.context === 'work'
												? (project.metadata.company ?? 'Client work')
												: 'Personal project'}</span
										><span
											>0{data.projects.findIndex((item) => item.slug === frame.contentSlug) +
												1}</span
										>
									</div>
									<h2>{project.metadata.title}</h2>
									<p>{project.metadata.excerpt}</p>
									<div class="tag-row">
										{#each project.metadata.technologies as tech (tech)}<span>{tech}</span>{/each}
									</div>
									{#if project.metadata.liveUrl}<a
											class="project-link"
											href={project.metadata.liveUrl}
											target="_blank"
											rel="noopener noreferrer">Visit project <ExternalLink size={14} /></a
										>{/if}
								</div>
							</article>
						{:else if frame.kind === 'experience'}
							{@const experience = data.experience.find((item) => item.slug === frame.contentSlug)!}
							<section class="story-frame">
								<div class="story-icon"><BriefcaseBusiness size={18} /></div>
								<div class="frame-eyebrow">Experience</div>
								<h2>{experience.metadata.role}</h2>
								<p class="story-place">{experience.metadata.company}</p>
								<p class="story-date">
									{formatDate(
										experience.metadata.startDate,
										experience.metadata.startDatePrecision
									)} — {experience.metadata.isCurrent
										? 'Present'
										: experience.metadata.endDate
											? formatDate(
													experience.metadata.endDate,
													experience.metadata.endDatePrecision
												)
											: ''}
								</p>
								<ul class="rich-copy">
									{#each markdownBullets(experience.body) as item (item)}<li>{item}</li>{/each}
								</ul>
							</section>
						{:else if frame.kind === 'education'}
							{@const education = data.education.find((item) => item.slug === frame.contentSlug)!}
							<section class="education-frame">
								<div class="story-icon story-icon--blue"><GraduationCap size={19} /></div>
								<div class="frame-eyebrow">Education</div>
								<h2>{education.metadata.institution}</h2>
								<p>{education.metadata.degree}</p>
								<span
									>{formatDate(
										education.metadata.completionDate,
										education.metadata.datePrecision
									)}</span
								>
							</section>
						{:else}
							<section class="skills-frame">
								<div>
									<div class="frame-eyebrow"><Sparkles size={14} /> Toolkit</div>
									<h2>Built across the stack.</h2>
									<p>Tools I use to move an idea from design file to resilient production code.</p>
								</div>
								<div class="skills-grid">
									{#each technologyCategories as category (category.key)}
										<div>
											<h3>{category.label}</h3>
											<p>{data.technologies.metadata[category.key].join(' · ')}</p>
										</div>
									{/each}
								</div>
							</section>
						{/if}
					</CanvasFrame>
				{/each}
			</div>

			{#each peers.filter((peer) => peer.cursor) as peer (peer.sessionId)}
				{@const screenPosition = worldToScreen(peer.cursor ?? { x: 0, y: 0 }, camera)}
				<div data-peer-cursor>
					<MultiplayerCursor
						name={peer.name}
						color={peer.color}
						x={screenPosition.x}
						y={screenPosition.y}
						{reducedMotion}
					/>
				</div>
			{/each}

			{#if !editingReady}
				<div class="offline-banner">
					<span></span>{connectionState === 'offline'
						? 'You’re offline. Browsing is still available.'
						: 'Connecting to the shared canvas…'}
				</div>
			{/if}
		</div>

		<div class="zoom-controls" aria-label="Zoom controls">
			<button type="button" aria-label="Zoom out" onclick={() => setZoom(camera.zoom / 1.2)}
				><Minus size={16} /></button
			>
			<span aria-live="polite">{zoomPercent}%</span>
			<button type="button" aria-label="Zoom in" onclick={() => setZoom(camera.zoom * 1.2)}
				><Plus size={16} /></button
			>
			<span class="zoom-divider"></span>
			<button
				type="button"
				aria-label="Fit selection"
				disabled={!selectedFrame}
				onclick={fitSelection}><Focus size={16} /></button
			>
			<button type="button" aria-label="Fit all" onclick={fitAll}><Scan size={16} /></button>
		</div>

		<button
			class="browse-button"
			type="button"
			aria-label="Browse portfolio"
			onclick={() => (browseOpen = true)}><List size={15} /> Browse</button
		>
	</div>
</main>

<Dialog.Root bind:open={browseOpen}>
	<Dialog.Portal>
		<Dialog.Overlay class="dialog-overlay" />
		<Dialog.Content class="browse-dialog" aria-describedby="browse-description">
			<div class="dialog-heading">
				<div>
					<Dialog.Title>Browse portfolio</Dialog.Title><Dialog.Description id="browse-description"
						>The same portfolio, arranged for reading.</Dialog.Description
					>
				</div>
				<Dialog.Close class="dialog-close" aria-label="Close browse mode"
					><X size={18} /></Dialog.Close
				>
			</div>
			<div class="browse-content" id="browse-content">
				<section>
					<p class="browse-label">Profile</p>
					<h2>{data.site.metadata.hero.firstName} {data.site.metadata.hero.lastName}</h2>
					<p>{data.site.metadata.hero.intro}</p>
					{#if data.site.metadata.hero.quote}
						<blockquote>{data.site.metadata.hero.quote}</blockquote>
					{/if}
				</section>
				<section>
					<p class="browse-label">Projects</p>
					{#each data.projects as project (project.slug)}<article>
							<h3>{project.metadata.title}</h3>
							<p>{project.metadata.excerpt}</p>
							{#if project.metadata.liveUrl}<a
									href={project.metadata.liveUrl}
									target="_blank"
									rel="noopener noreferrer">Visit project <ExternalLink size={13} /></a
								>{/if}
						</article>{/each}
				</section>
				<section>
					<p class="browse-label">Experience</p>
					{#each data.experience as item (item.slug)}<article>
							<h3>{item.metadata.role}</h3>
							<p class="browse-subtitle">{item.metadata.company}</p>
							<ul class="rich-copy">
								{#each markdownBullets(item.body) as bullet (bullet)}<li>{bullet}</li>{/each}
							</ul>
						</article>{/each}
				</section>
				<section>
					<p class="browse-label">Education</p>
					{#each data.education as item (item.slug)}<article>
							<h3>{item.metadata.institution}</h3>
							<p>{item.metadata.degree}</p>
						</article>{/each}
				</section>
				<section>
					<p class="browse-label">Technologies</p>
					<h2>Built across the stack.</h2>
					{#each technologyCategories as category (category.key)}
						<article>
							<h3>{category.label}</h3>
							<p>{data.technologies.metadata[category.key].join(' · ')}</p>
						</article>
					{/each}
				</section>
				<section>
					<p class="browse-label">Contact</p>
					<h2>{data.site.metadata.footer.heading}</h2>
					<a href={`mailto:${data.site.metadata.contact.email}`}
						>{data.site.metadata.contact.email}</a
					>
					<div class="browse-contact-links">
						{#if data.site.metadata.contact.github}
							<a href={data.site.metadata.contact.github} target="_blank" rel="noopener noreferrer"
								>GitHub <ExternalLink size={13} /></a
							>
						{/if}
						{#if data.site.metadata.contact.linkedin}
							<a
								href={data.site.metadata.contact.linkedin}
								target="_blank"
								rel="noopener noreferrer">LinkedIn <ExternalLink size={13} /></a
							>
						{/if}
						{#if data.site.metadata.resumeUrl}
							<a href={data.site.metadata.resumeUrl} target="_blank" rel="noopener noreferrer"
								>Resume <ExternalLink size={13} /></a
							>
						{/if}
					</div>
					<p>{data.site.metadata.footer.builtWith}</p>
				</section>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

<Dialog.Root
	bind:open={resetDialogOpen}
	onOpenChange={(open) => {
		if (!open) {
			ownerKey = '';
			resetError = '';
		}
	}}
>
	<Dialog.Portal>
		<Dialog.Overlay class="dialog-overlay" />
		<Dialog.Content class="reset-dialog">
			<Dialog.Title>Reset board</Dialog.Title>
			<Dialog.Description
				>Restore every frame to its original position. Everyone on the canvas will see the reset.</Dialog.Description
			>
			<label for="owner-key">Owner key</label>
			<input
				id="owner-key"
				type="password"
				autocomplete="off"
				bind:value={ownerKey}
				aria-invalid={Boolean(resetError)}
				aria-describedby={resetError ? 'reset-error' : undefined}
			/>
			{#if resetError}<p class="reset-error" id="reset-error" role="alert">{resetError}</p>{/if}
			<div class="dialog-actions">
				<Dialog.Close class="secondary-button">Cancel</Dialog.Close>
				<button
					class="danger-button"
					type="button"
					disabled={!ownerKey || resetPending}
					onclick={resetBoard}>{resetPending ? 'Resetting…' : 'Reset board'}</button
				>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

<style>
	.portfolio-file {
		height: 100dvh;
		overflow: hidden;
		background: var(--canvas-background);
	}
	.topbar {
		position: relative;
		z-index: 50;
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		height: 48px;
		padding: 0 10px;
		border-bottom: 1px solid #0d0d0d;
		background: var(--figma-dark);
		color: #f4f4f4;
		box-shadow: 0 1px 3px rgb(0 0 0 / 30%);
	}
	.topbar__left,
	.topbar__right,
	.topbar__center,
	.file-trigger,
	.collaborators,
	.connection-status,
	.resume-button,
	.tool-hint {
		display: flex;
		align-items: center;
	}
	.topbar__right {
		justify-content: flex-end;
		gap: 12px;
		min-width: 0;
	}
	.file-trigger {
		gap: 8px;
		min-width: 0;
		border: 0;
		background: transparent;
		color: inherit;
		padding: 4px 7px;
		border-radius: 4px;
		font-size: 12px;
		font-weight: 500;
	}
	.file-trigger:hover {
		background: #343434;
	}
	.file-mark {
		display: grid;
		width: 24px;
		height: 24px;
		place-items: center;
		border-radius: 5px;
		background: #8d5cff;
		color: white;
		font-family: var(--font-serif);
		font-size: 17px;
	}
	.file-trigger__name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.topbar__center {
		gap: 7px;
	}
	.tool-button {
		display: grid;
		width: 30px;
		height: 30px;
		border: 0;
		place-items: center;
		border-radius: 4px;
		background: transparent;
		color: #ddd;
	}
	.tool-button.is-active {
		background: var(--figma-blue);
		color: white;
	}
	.tool-divider {
		width: 1px;
		height: 18px;
		background: #474747;
	}
	.tool-hint {
		color: #9a9a9a;
		font-size: 11px;
	}
	:global(.mobile-layers-toggle) {
		display: none;
		width: 30px;
		height: 30px;
		border: 0;
		place-items: center;
		border-radius: 4px;
		background: transparent;
		color: #ddd;
	}
	.collaborators {
		flex-direction: row-reverse;
		padding-left: 5px;
	}
	.collaborator-avatar {
		display: grid;
		width: 25px;
		height: 25px;
		margin-left: -5px;
		place-items: center;
		border: 2px solid var(--figma-dark);
		border-radius: 50%;
		color: white;
		font-size: 10px;
		font-weight: 600;
		text-transform: uppercase;
	}
	.connection-status {
		gap: 6px;
		color: #bbb;
		font-size: 11px;
		white-space: nowrap;
	}
	.connection-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #e5a83d;
	}
	.connection-status.is-open .connection-dot {
		background: #4aca76;
		box-shadow: 0 0 0 3px rgb(74 202 118 / 12%);
	}
	.connection-status.is-offline .connection-dot,
	.connection-status.is-closed .connection-dot {
		background: #888;
	}
	.resume-button {
		gap: 5px;
		padding: 6px 9px;
		border-radius: 4px;
		background: #fff;
		color: #1e1e1e;
		font-size: 11px;
		font-weight: 600;
		text-decoration: none;
	}
	.workspace {
		position: relative;
		display: flex;
		height: calc(100dvh - 48px);
		overflow: hidden;
	}
	.layers-panel {
		position: relative;
		z-index: 30;
		flex: 0 0 236px;
		width: 236px;
		border-right: 1px solid var(--panel-border);
		background: #f7f7f7;
		color: #333;
		box-shadow: 1px 0 3px rgb(0 0 0 / 5%);
		transition:
			flex-basis 160ms ease,
			width 160ms ease;
	}
	.layers-panel.is-collapsed {
		flex-basis: 40px;
		width: 40px;
		overflow: hidden;
	}
	.layers-panel.is-collapsed .panel-heading {
		justify-content: center;
		padding: 0;
	}
	.layers-panel.is-collapsed .panel-heading > span {
		display: none;
	}
	.panel-heading {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 40px;
		padding: 0 9px 0 13px;
		border-bottom: 1px solid #dedede;
		font-size: 11px;
		font-weight: 600;
	}
	.panel-heading button {
		display: grid;
		width: 26px;
		height: 26px;
		border: 0;
		place-items: center;
		border-radius: 4px;
		background: transparent;
		color: #666;
	}
	.panel-heading button:hover {
		background: #e9e9e9;
	}
	.layer-tree {
		padding: 8px;
		overflow: auto;
	}
	.layer-row {
		display: flex;
		width: 100%;
		min-width: 0;
		align-items: center;
		gap: 8px;
		padding: 7px 8px;
		border: 0;
		border-radius: 4px;
		background: transparent;
		color: #565656;
		font-size: 11px;
		text-align: left;
	}
	.layer-row :global(svg) {
		flex: none;
		color: #838383;
	}
	.layer-row span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.layer-row:hover {
		background: #ececec;
	}
	.layer-row.is-selected {
		background: #daedfb;
		color: #075f9e;
	}
	.canvas-viewport {
		position: relative;
		flex: 1;
		min-width: 0;
		overflow: hidden;
		background: var(--canvas-background);
		cursor: grab;
		touch-action: none;
	}
	.canvas-viewport.is-panning {
		cursor: grabbing;
	}
	.canvas-grid {
		position: absolute;
		inset: 0;
		background-image: radial-gradient(#c8c8c8 0.7px, transparent 0.7px);
		background-size: 16px 16px;
		opacity: 0.45;
		pointer-events: none;
	}
	.canvas-world {
		position: absolute;
		top: 0;
		left: 0;
		width: 1px;
		height: 1px;
		transform-origin: top left;
	}
	.offline-banner {
		position: absolute;
		bottom: 20px;
		left: 50%;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 11px;
		border: 1px solid #d0d0d0;
		border-radius: 5px;
		background: rgb(255 255 255 / 95%);
		color: #565656;
		font-size: 11px;
		transform: translateX(-50%);
		box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
	}
	.offline-banner span {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #e2a23b;
	}
	.zoom-controls {
		position: absolute;
		z-index: 35;
		right: 16px;
		bottom: 16px;
		display: flex;
		align-items: center;
		height: 34px;
		padding: 3px;
		border: 1px solid #d2d2d2;
		border-radius: 5px;
		background: rgb(255 255 255 / 96%);
		box-shadow: 0 2px 7px rgb(0 0 0 / 12%);
	}
	.zoom-controls button {
		display: grid;
		width: 28px;
		height: 27px;
		border: 0;
		place-items: center;
		border-radius: 3px;
		background: transparent;
		color: #555;
	}
	.zoom-controls button:hover:not(:disabled) {
		background: #ededed;
	}
	.zoom-controls button:disabled {
		opacity: 0.35;
	}
	.zoom-controls > span:not(.zoom-divider) {
		min-width: 46px;
		color: #555;
		font-size: 11px;
		text-align: center;
	}
	.zoom-divider {
		width: 1px;
		height: 17px;
		margin-inline: 2px;
		background: #ddd;
	}
	.browse-button {
		position: absolute;
		z-index: 35;
		bottom: 16px;
		left: 252px;
		display: flex;
		align-items: center;
		gap: 6px;
		height: 34px;
		padding: 0 10px;
		border: 1px solid #d2d2d2;
		border-radius: 5px;
		background: rgb(255 255 255 / 96%);
		color: #555;
		font-size: 11px;
		font-weight: 500;
		box-shadow: 0 2px 7px rgb(0 0 0 / 12%);
	}
	.profile-frame {
		display: flex;
		height: 100%;
		flex-direction: column;
		justify-content: center;
		padding: 52px 58px;
		background: #f8f8f6;
	}
	.profile-kicker {
		display: flex;
		align-items: center;
		gap: 8px;
		color: #6d6d6d;
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}
	.profile-kicker span {
		width: 22px;
		height: 1px;
		background: #1e1e1e;
	}
	.profile-frame h1 {
		margin: 22px 0 12px;
		font-family: var(--font-serif);
		font-size: 78px;
		font-weight: 400;
		letter-spacing: -0.045em;
		line-height: 0.76;
	}
	.profile-tagline {
		max-width: 470px;
		margin: 12px 0 0;
		font-size: 20px;
		font-weight: 500;
		line-height: 1.25;
	}
	.profile-intro {
		max-width: 510px;
		margin: 10px 0 0;
		color: #646464;
		font-size: 12px;
		line-height: 1.55;
	}
	.profile-actions {
		display: flex;
		gap: 18px;
		align-items: center;
		margin-top: 22px;
	}
	.profile-actions button,
	.profile-actions a {
		border: 0;
		background: transparent;
		color: #202020;
		font-size: 11px;
		font-weight: 600;
		text-decoration: none;
	}
	.profile-actions button {
		padding: 8px 13px;
		border-radius: 4px;
		background: #1e1e1e;
		color: #fff;
	}
	.profile-actions a {
		border-bottom: 1px solid #999;
	}
	.contact-frame {
		display: flex;
		height: 100%;
		flex-direction: column;
		padding: 46px 38px;
		background: #242424;
		color: white;
	}
	.frame-eyebrow {
		display: flex;
		align-items: center;
		gap: 6px;
		color: #8b8b8b;
		font-size: 10px;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	.contact-frame .frame-eyebrow {
		color: #84d39b;
	}
	.contact-frame h2 {
		max-width: 270px;
		margin: 34px 0 12px;
		font-family: var(--font-serif);
		font-size: 42px;
		font-weight: 400;
		line-height: 0.95;
	}
	.contact-frame > p {
		color: #aaa;
		font-size: 12px;
		line-height: 1.5;
	}
	.email-card {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-top: auto;
		padding: 11px 0;
		border-top: 1px solid #454545;
		border-bottom: 1px solid #454545;
		color: white;
		text-decoration: none;
	}
	.email-card > span {
		display: flex;
		min-width: 0;
		flex: 1;
		flex-direction: column;
		font-size: 11px;
		font-weight: 600;
	}
	.email-card small {
		overflow: hidden;
		color: #aaa;
		font-size: 10px;
		font-weight: 400;
		text-overflow: ellipsis;
	}
	.contact-links {
		display: flex;
		gap: 18px;
		margin-top: 18px;
	}
	.contact-links a {
		display: flex;
		align-items: center;
		gap: 6px;
		color: #b9b9b9;
		font-size: 10px;
		text-decoration: none;
	}
	.contact-links :global(svg) {
		width: 13px;
		height: 13px;
	}
	.project-frame {
		display: grid;
		height: 100%;
		grid-template-rows: 215px 1fr;
	}
	.project-image {
		overflow: hidden;
		background: #ddd;
	}
	.project-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		pointer-events: none;
	}
	.project-image--generated {
		display: grid;
		position: relative;
		padding: 25px;
		place-content: center;
		background: linear-gradient(135deg, #dff36b, #b6e1ff);
		color: #183221;
		text-align: center;
	}
	.project-image--generated span:first-child {
		position: absolute;
		top: 24px;
		left: 30px;
		font-family: var(--font-serif);
		font-size: 54px;
	}
	.project-image--generated span:nth-child(2) {
		font-size: 10px;
		text-transform: uppercase;
	}
	.project-image--generated strong {
		font-family: var(--font-serif);
		font-size: 70px;
		font-weight: 400;
	}
	.project-copy {
		position: relative;
		padding: 19px 24px;
	}
	.project-meta {
		display: flex;
		justify-content: space-between;
		color: #8b8b8b;
		font-size: 9px;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	.project-copy h2 {
		margin: 10px 0 5px;
		font-family: var(--font-serif);
		font-size: 29px;
		font-weight: 400;
		line-height: 1;
	}
	.project-copy > p {
		display: -webkit-box;
		max-width: 440px;
		margin: 0;
		overflow: hidden;
		color: #686868;
		font-size: 10px;
		line-height: 1.45;
		-webkit-box-orient: vertical;
		line-clamp: 2;
		-webkit-line-clamp: 2;
	}
	.tag-row {
		display: flex;
		gap: 5px;
		margin-top: 10px;
	}
	.tag-row span {
		padding: 3px 6px;
		border-radius: 3px;
		background: #f0f0f0;
		color: #666;
		font-size: 8px;
	}
	.project-link {
		position: absolute;
		right: 23px;
		bottom: 18px;
		display: flex;
		align-items: center;
		gap: 5px;
		color: #177bc0;
		font-size: 10px;
		font-weight: 600;
		text-decoration: none;
	}
	.story-frame {
		height: 100%;
		padding: 38px 42px;
	}
	.story-icon {
		display: grid;
		width: 36px;
		height: 36px;
		margin-bottom: 28px;
		place-items: center;
		border-radius: 8px;
		background: #292929;
		color: white;
	}
	.story-frame h2,
	.education-frame h2,
	.skills-frame h2 {
		margin: 9px 0 3px;
		font-family: var(--font-serif);
		font-size: 33px;
		font-weight: 400;
		line-height: 1;
	}
	.story-place {
		margin: 0;
		font-size: 12px;
		font-weight: 600;
	}
	.story-date {
		margin: 4px 0 18px;
		color: #888;
		font-size: 10px;
	}
	.rich-copy {
		color: #5f5f5f;
		font-size: 10px;
		line-height: 1.45;
	}
	.rich-copy :global(ul) {
		margin: 0;
		padding-left: 15px;
	}
	.rich-copy :global(li) {
		margin-bottom: 7px;
	}
	.education-frame {
		display: flex;
		height: 100%;
		flex-direction: column;
		padding: 34px 38px;
		background: #f8f8f6;
	}
	.story-icon--blue {
		margin-bottom: auto;
		background: #dceeff;
		color: #1678bd;
	}
	.education-frame > p {
		margin: 5px 0;
		color: #555;
		font-size: 11px;
	}
	.education-frame > span {
		margin-top: 5px;
		color: #888;
		font-size: 10px;
	}
	.skills-frame {
		display: grid;
		height: 100%;
		grid-template-columns: 0.85fr 1.15fr;
		gap: 50px;
		padding: 48px;
		background: #202020;
		color: white;
	}
	.skills-frame h2 {
		max-width: 240px;
		margin-top: 22px;
		font-size: 40px;
	}
	.skills-frame > div:first-child > p {
		max-width: 260px;
		color: #a5a5a5;
		font-size: 11px;
		line-height: 1.5;
	}
	.skills-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0;
		border-top: 1px solid #424242;
		border-left: 1px solid #424242;
	}
	.skills-grid > div {
		padding: 18px;
		border-right: 1px solid #424242;
		border-bottom: 1px solid #424242;
	}
	.skills-grid h3 {
		margin: 0 0 9px;
		color: #8b8b8b;
		font-size: 9px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	.skills-grid p {
		margin: 0;
		color: #ddd;
		font-size: 10px;
		line-height: 1.55;
	}
	:global(.file-menu) {
		z-index: 100;
		min-width: 190px;
		padding: 5px;
		border: 1px solid #454545;
		border-radius: 6px;
		background: #2c2c2c;
		color: #eee;
		box-shadow: 0 8px 30px rgb(0 0 0 / 35%);
	}
	:global(.file-menu__item) {
		display: flex;
		align-items: center;
		gap: 9px;
		padding: 8px 9px;
		border-radius: 4px;
		outline: none;
		font-size: 11px;
	}
	:global(.file-menu__item[data-highlighted]) {
		background: #3e3e3e;
	}
	:global(.file-menu__item--danger) {
		color: #ff9999;
	}
	:global(.file-menu__separator) {
		height: 1px;
		margin: 5px;
		background: #494949;
	}
	:global(.dialog-overlay) {
		position: fixed;
		z-index: 100;
		inset: 0;
		background: rgb(0 0 0 / 48%);
		backdrop-filter: blur(2px);
	}
	:global(.reset-dialog),
	:global(.browse-dialog) {
		position: fixed;
		z-index: 101;
		top: 50%;
		left: 50%;
		border: 1px solid #d5d5d5;
		border-radius: 8px;
		background: white;
		color: #292929;
		box-shadow: 0 18px 60px rgb(0 0 0 / 25%);
		transform: translate(-50%, -50%);
	}
	:global(.reset-dialog) {
		width: min(420px, calc(100vw - 28px));
		padding: 25px;
	}
	:global(.reset-dialog h2),
	:global(.browse-dialog h2) {
		margin: 0;
		font-size: 16px;
	}
	:global(.reset-dialog > p),
	:global(.browse-dialog [data-description]) {
		margin: 8px 0 20px;
		color: #6b6b6b;
		font-size: 12px;
		line-height: 1.5;
	}
	:global(.reset-dialog label) {
		display: block;
		margin-bottom: 6px;
		font-size: 11px;
		font-weight: 600;
	}
	:global(.reset-dialog input) {
		width: 100%;
		height: 36px;
		padding: 0 10px;
		border: 1px solid #bbb;
		border-radius: 4px;
	}
	.reset-error {
		color: #ba2929 !important;
	}
	.dialog-actions {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
		margin-top: 22px;
	}
	:global(.secondary-button),
	.danger-button {
		padding: 8px 12px;
		border: 0;
		border-radius: 4px;
		font-size: 11px;
		font-weight: 600;
	}
	:global(.secondary-button) {
		background: #eee;
		color: #333;
	}
	.danger-button {
		background: #c23b3b;
		color: white;
	}
	.danger-button:disabled {
		opacity: 0.45;
	}
	:global(.browse-dialog) {
		width: min(760px, calc(100vw - 28px));
		max-height: min(760px, calc(100dvh - 40px));
		overflow: hidden;
	}
	.dialog-heading {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		padding: 24px 28px 18px;
		border-bottom: 1px solid #e2e2e2;
	}
	:global(.dialog-close) {
		display: grid;
		width: 30px;
		height: 30px;
		border: 0;
		place-items: center;
		border-radius: 4px;
		background: #eee;
		color: #555;
	}
	.browse-content {
		max-height: calc(100dvh - 150px);
		padding: 0 28px 40px;
		overflow: auto;
	}
	.browse-content section {
		padding: 26px 0;
		border-bottom: 1px solid #e4e4e4;
	}
	.browse-content section:last-child {
		border: 0;
	}
	.browse-label {
		margin: 0 0 14px !important;
		color: #666 !important;
		font-size: 9px !important;
		font-weight: 600;
		letter-spacing: 0.09em;
		text-transform: uppercase;
	}
	.browse-content h2 {
		font-family: var(--font-serif);
		font-size: 32px;
		font-weight: 400;
	}
	.browse-content h3 {
		margin: 0 0 5px;
		font-size: 14px;
	}
	.browse-content p {
		max-width: 620px;
		color: #666;
		font-size: 12px;
		line-height: 1.5;
	}
	.browse-content blockquote {
		max-width: 620px;
		margin: 18px 0 0;
		padding-left: 14px;
		border-left: 2px solid #d5d5d5;
		color: #555;
		font-family: var(--font-serif);
		font-size: 18px;
		line-height: 1.35;
	}
	.browse-content article {
		margin-top: 22px;
	}
	.browse-content a {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		color: #0878c8;
		font-size: 11px;
		font-weight: 600;
	}
	.browse-contact-links {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		margin-top: 14px;
	}
	.browse-subtitle {
		margin: 0 0 10px !important;
		color: #333 !important;
		font-weight: 600;
	}
	:global(.mobile-layers),
	:global(.mobile-layer-backdrop) {
		display: none;
	}
	@media (max-width: 800px) {
		.topbar {
			grid-template-columns: 1fr auto;
			height: 46px;
			padding-inline: 6px;
		}
		.topbar__center,
		.layers-panel,
		.collaborators,
		.connection-status,
		.file-mark {
			display: none;
		}
		:global(.mobile-layers-toggle) {
			display: grid;
			width: 40px;
			height: 40px;
		}
		.file-trigger__name {
			max-width: 42vw;
		}
		.resume-button {
			padding: 6px;
		}
		.workspace {
			height: calc(100dvh - 46px);
		}
		.browse-button {
			left: 12px;
			bottom: 12px;
		}
		.zoom-controls {
			right: 12px;
			bottom: 12px;
			height: 46px;
		}
		.zoom-controls button {
			width: 40px;
			height: 40px;
		}
		:global(.mobile-layer-backdrop) {
			position: fixed;
			z-index: 80;
			inset: 46px 0 0;
			display: block;
			width: 100%;
			padding: 0;
			border: 0;
			background: rgb(0 0 0 / 25%);
		}
		:global(.mobile-layers) {
			position: fixed;
			z-index: 90;
			top: 46px;
			bottom: 0;
			left: 0;
			display: block;
			width: min(300px, 86vw);
			padding-bottom: 18px;
			border: 0;
			overflow: auto;
			background: #f8f8f8;
			box-shadow: 6px 0 24px rgb(0 0 0 / 18%);
		}
		:global(.mobile-layers) .layer-row {
			padding: 10px 14px;
		}
		:global(.mobile-layers-close) {
			display: grid;
			width: 40px;
			height: 40px;
			border: 0;
			place-items: center;
			border-radius: 4px;
			background: transparent;
			color: #666;
		}
		.profile-frame {
			padding: 46px;
		}
	}
</style>
