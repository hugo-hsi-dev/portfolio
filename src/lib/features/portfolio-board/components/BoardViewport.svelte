<script lang="ts">
	import { onMount } from 'svelte';

	import type { FrameKind } from '$lib/features/portfolio-content';

	import type { PortfolioBoardController } from '../board-controller.svelte';
	import CanvasFrame from './CanvasFrame.svelte';
	import FrameContent from './FrameContent.svelte';
	import MultiplayerCursor from './MultiplayerCursor.svelte';

	let { controller }: { controller: PortfolioBoardController } = $props();

	let viewport: HTMLDivElement;

	const frameLabels: Record<FrameKind, string> = {
		profile: 'Profile',
		contact: 'Contact',
		project: 'Project',
		experience: 'Experience',
		education: 'Education',
		technologies: 'Skills'
	};

	onMount(() => controller.mount(viewport));

	function openFirstProject(): void {
		const project = controller.frames.find((frame) => frame.kind === 'project');
		if (project) controller.goToFrame(project);
	}
</script>

<div
	class={[
		'canvas-viewport',
		controller.tool === 'hand' && 'is-hand-tool',
		controller.panPointerId !== null && 'is-panning',
		controller.dragState && 'is-dragging',
		controller.marqueeState && 'is-marquee-selecting',
		controller.followingPeer && 'is-following'
	]}
	bind:this={viewport}
	data-canvas-viewport
	data-mobile-viewport={controller.mobileViewport}
	data-browse-open={controller.browseOpen}
	role="application"
	aria-label="Interactive portfolio canvas"
	aria-describedby="canvas-instructions"
	tabindex="-1"
	onpointerdown={controller.onViewportPointerDown}
	onpointermove={controller.onPointerMove}
	onpointerup={controller.onPointerUp}
	onpointercancel={controller.onPointerUp}
	onwheel={controller.onWheel}
>
	<p class="sr-only" id="canvas-instructions">
		Use V for select, H or Space for hand tool, arrow keys to nudge selected frames, and Shift plus
		1 or 2 to fit the canvas or selection. Browse mode provides the same portfolio in reading order.
	</p>
	<div class="canvas-grid" aria-hidden="true"></div>
	<div
		class="canvas-world"
		data-canvas-world
		style:transform={`translate3d(${controller.camera.x}px, ${controller.camera.y}px, 0) scale(${controller.camera.zoom})`}
	>
		{#each controller.visibleFrames as frame (frame.id)}
			{@const position = controller.framePosition(frame.id)}
			{@const metadata = controller.frameMetadata(frame.id)}
			{@const remoteSelection = controller.remoteSelection(frame.id)}
			<CanvasFrame
				id={frame.id}
				label={frameLabels[frame.kind]}
				title={frame.title}
				x={position.x}
				y={position.y}
				width={frame.width}
				height={frame.height}
				selected={controller.isSelected(frame.id)}
				multipleSelection={controller.selectedFrameIds.length > 1}
				dragging={controller.isDragging(frame.id)}
				hovered={controller.hoveredFrameId === frame.id}
				locked={metadata.locked}
				remoteSelectionColor={remoteSelection?.color ?? null}
				onfocus={() => controller.onFrameFocus(frame.id)}
				onpointerdown={(event) => controller.onFramePointerDown(event, frame.id)}
			>
				<FrameContent {frame} onOpenProjects={openFirstProject} />
			</CanvasFrame>
		{/each}

		{#if controller.visibleSelectionBounds && controller.visibleSelectionCount > 1}
			{@const bounds = controller.visibleSelectionBounds}
			<div
				class="group-selection"
				aria-hidden="true"
				style:left={`${bounds.x}px`}
				style:top={`${bounds.y}px`}
				style:width={`${bounds.width}px`}
				style:height={`${bounds.height}px`}
			>
				<span class="group-handle group-handle--nw"></span>
				<span class="group-handle group-handle--ne"></span>
				<span class="group-handle group-handle--sw"></span>
				<span class="group-handle group-handle--se"></span>
			</div>
		{/if}

		{#if controller.marqueeBounds}
			{@const marquee = controller.marqueeBounds}
			<div
				class="selection-marquee"
				aria-hidden="true"
				style:left={`${marquee.x}px`}
				style:top={`${marquee.y}px`}
				style:width={`${marquee.width}px`}
				style:height={`${marquee.height}px`}
			></div>
		{/if}

		{#each controller.snapGuides as guide, index (`${guide.orientation}-${guide.position}-${index}`)}
			{#if guide.orientation === 'vertical'}
				<div
					class="snap-guide is-vertical"
					aria-hidden="true"
					style:left={`${guide.position}px`}
					style:top={`${guide.start}px`}
					style:height={`${guide.end - guide.start}px`}
				></div>
			{:else}
				<div
					class="snap-guide is-horizontal"
					aria-hidden="true"
					style:left={`${guide.start}px`}
					style:top={`${guide.position}px`}
					style:width={`${guide.end - guide.start}px`}
				></div>
			{/if}
		{/each}
	</div>

	{#each controller.peerModel.peers.filter((peer) => peer.cursor) as peer (peer.sessionId)}
		{@const screenPosition = controller.peerScreenPosition(peer)}
		<div data-peer-cursor>
			<MultiplayerCursor
				name={peer.name}
				color={peer.color}
				x={screenPosition.x}
				y={screenPosition.y}
				reducedMotion={controller.reducedMotion}
			/>
		</div>
	{/each}

	{#if !controller.editingReady}
		<div class="offline-banner">
			<span></span>{controller.connectionState === 'offline'
				? 'You’re offline. Browsing is still available.'
				: controller.connectionState === 'failed'
					? 'The live canvas connection failed. Browsing is still available.'
					: 'Connecting to the shared canvas…'}
		</div>
	{/if}

	{#if controller.followingPeer}
		<div class="follow-banner" role="status">
			<span style:background={controller.followingPeer.color}></span>
			Following {controller.followingPeer.name}
			<button type="button" onclick={controller.stopFollowing}>Stop</button>
		</div>
	{/if}

	{#if controller.editorNotice}
		<div class="editor-notice" role="status">
			{controller.editorNotice}
			<button type="button" aria-label="Dismiss notification" onclick={controller.clearNotice}
				>×</button
			>
		</div>
	{/if}
</div>

<style>
	.canvas-viewport {
		position: relative;
		flex: 1;
		min-width: 0;
		overflow: hidden;
		background: var(--canvas-background);
		cursor: default;
		touch-action: none;
	}
	.canvas-viewport:focus-visible {
		outline: 2px solid var(--figma-blue);
		outline-offset: -2px;
	}
	.canvas-viewport.is-hand-tool {
		cursor: grab;
	}
	.canvas-viewport.is-panning {
		cursor: grabbing;
	}
	.canvas-viewport.is-marquee-selecting {
		cursor: crosshair;
	}
	.canvas-grid {
		position: absolute;
		inset: 0;
		background-image: radial-gradient(#b7bbc0 0.55px, transparent 0.55px);
		background-size: 20px 20px;
		opacity: 0.36;
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
	.group-selection,
	.selection-marquee,
	.snap-guide {
		position: absolute;
		pointer-events: none;
	}
	.group-selection {
		z-index: 10;
		border: 1.5px solid var(--figma-blue);
	}
	.group-handle {
		position: absolute;
		width: 8px;
		height: 8px;
		border: 1.5px solid var(--figma-blue);
		background: white;
	}
	.group-handle--nw {
		top: -5px;
		left: -5px;
	}
	.group-handle--ne {
		top: -5px;
		right: -5px;
	}
	.group-handle--sw {
		bottom: -5px;
		left: -5px;
	}
	.group-handle--se {
		right: -5px;
		bottom: -5px;
	}
	.selection-marquee {
		z-index: 12;
		border: 1px solid var(--figma-blue);
		background: rgb(13 153 255 / 10%);
	}
	.snap-guide {
		z-index: 15;
		background: #f24822;
	}
	.snap-guide.is-vertical {
		width: 1px;
	}
	.snap-guide.is-horizontal {
		height: 1px;
	}
	.offline-banner {
		position: absolute;
		top: 12px;
		bottom: auto;
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
	.follow-banner,
	.editor-notice {
		position: absolute;
		z-index: 30;
		top: 12px;
		left: 50%;
		display: flex;
		align-items: center;
		gap: 8px;
		min-height: 34px;
		padding: 5px 7px 5px 10px;
		border: 1px solid #3a3a3a;
		border-radius: 6px;
		background: #2c2c2c;
		color: #f5f5f5;
		font-size: 11px;
		box-shadow: 0 3px 12px rgb(0 0 0 / 18%);
		transform: translateX(-50%);
	}
	.follow-banner > span {
		width: 7px;
		height: 7px;
		border-radius: 50%;
	}
	.follow-banner button,
	.editor-notice button {
		min-height: 24px;
		padding: 0 8px;
		border: 0;
		border-radius: 4px;
		background: #444;
		color: white;
		font-size: 11px;
	}
	.editor-notice {
		top: auto;
		bottom: 64px;
		border-color: #d3d3d3;
		background: white;
		color: #333;
	}
	.editor-notice button {
		padding: 0 7px;
		background: #eeeeee;
		color: #555;
		font-size: 16px;
	}
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
	@media (max-width: 760px) {
		.follow-banner,
		.editor-notice,
		.offline-banner {
			max-width: calc(100% - 24px);
			white-space: normal;
		}
	}
</style>
