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
	class={['canvas-viewport', controller.panPointerId !== null && 'is-panning']}
	bind:this={viewport}
	data-canvas-viewport
	role="application"
	aria-label="Interactive portfolio canvas"
	tabindex="-1"
	onpointerdown={controller.onViewportPointerDown}
	onpointermove={controller.onPointerMove}
	onpointerup={controller.onPointerUp}
	onpointercancel={controller.onPointerUp}
	onwheel={controller.onWheel}
>
	<div class="canvas-grid" aria-hidden="true"></div>
	<div
		class="canvas-world"
		data-canvas-world
		style:transform={`translate3d(${controller.camera.x}px, ${controller.camera.y}px, 0) scale(${controller.camera.zoom})`}
	>
		{#each controller.frames as frame (frame.id)}
			{@const position = controller.framePosition(frame.id)}
			<CanvasFrame
				id={frame.id}
				label={frameLabels[frame.kind]}
				title={frame.title}
				x={position.x}
				y={position.y}
				width={frame.width}
				height={frame.height}
				selected={controller.selectedFrameId === frame.id}
				dragging={controller.dragState?.frameId === frame.id}
				onfocus={() => (controller.selectedFrameId = frame.id)}
				onpointerdown={(event) => controller.onFramePointerDown(event, frame.id)}
			>
				<FrameContent {frame} onOpenProjects={openFirstProject} />
			</CanvasFrame>
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
</div>

<style>
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
</style>
