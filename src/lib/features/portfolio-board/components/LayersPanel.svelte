<script lang="ts">
	import {
		BriefcaseBusiness,
		ChevronDown,
		Eye,
		EyeOff,
		FileText,
		GraduationCap,
		Layers3,
		LocateFixed,
		Lock,
		PanelLeftClose,
		PanelLeftOpen,
		Sparkles,
		Unlock,
		UserRound
	} from '@lucide/svelte';

	import type { CanvasFrame } from '$lib/features/portfolio-content';

	import type { PortfolioBoardController } from '../board-controller.svelte';

	let { controller }: { controller: PortfolioBoardController } = $props();

	function frameKindLabel(frame: CanvasFrame): string {
		switch (frame.kind) {
			case 'profile':
				return 'Profile';
			case 'contact':
				return 'Contact';
			case 'project':
				return 'Project';
			case 'experience':
				return 'Experience';
			case 'education':
				return 'Education';
			case 'technologies':
				return 'Technologies';
		}
	}
</script>

<nav class={['layers-panel', !controller.layersOpen && 'is-collapsed']} aria-label="Layers">
	<div class="panel-heading">
		<span class="panel-heading__label">Layers</span>
		<button
			class="panel-toggle"
			type="button"
			aria-label="Toggle layers"
			aria-expanded={controller.layersOpen}
			onclick={() => (controller.layersOpen = !controller.layersOpen)}
		>
			{#if controller.layersOpen}<PanelLeftClose size={15} />{:else}<PanelLeftOpen size={16} />{/if}
		</button>
	</div>

	{#if controller.layersOpen}
		<div class="page-heading" aria-hidden="true">
			<ChevronDown size={13} strokeWidth={2.2} />
			<Layers3 size={14} />
			<span>Portfolio</span>
		</div>

		<div class="layer-tree">
			{#each controller.frames as frame (frame.id)}
				{@const metadata = controller.frameMetadata(frame.id)}
				<div
					role="group"
					aria-label={`${frame.title} layer`}
					class={[
						'layer-row',
						controller.isSelected(frame.id) && 'is-selected',
						controller.hoveredFrameId === frame.id && 'is-hovered',
						!metadata.visible && 'is-hidden',
						metadata.locked && 'is-locked'
					]}
					onpointerenter={() => (controller.hoveredFrameId = frame.id)}
					onpointerleave={() => {
						if (controller.hoveredFrameId === frame.id) controller.hoveredFrameId = null;
					}}
				>
					<button
						class="layer-select"
						type="button"
						aria-label={`Select ${frame.title}`}
						aria-pressed={controller.isSelected(frame.id)}
						title={`${frame.title} · ${frameKindLabel(frame)}`}
						onclick={(event) => controller.selectFrameFromLayer(event, frame)}
					>
						<span class="kind-icon" aria-hidden="true">
							{#if frame.kind === 'profile'}<UserRound size={13} />
							{:else if frame.kind === 'project'}<BriefcaseBusiness size={13} />
							{:else if frame.kind === 'education'}<GraduationCap size={13} />
							{:else if frame.kind === 'technologies'}<Sparkles size={13} />
							{:else}<FileText size={13} />{/if}
						</span>
						<span class="layer-name">{frame.title}</span>
					</button>

					<div class="layer-actions">
						<button
							class="row-action locate-action"
							type="button"
							aria-label={`Go to ${frame.title}`}
							title="Zoom to layer"
							onclick={() => controller.goToFrame(frame)}
						>
							<LocateFixed size={13} />
						</button>
						<button
							class={['row-action', !metadata.visible && 'is-active']}
							type="button"
							aria-label={`${metadata.visible ? 'Hide' : 'Show'} ${frame.title}`}
							aria-pressed={!metadata.visible}
							title={metadata.visible ? 'Hide layer' : 'Show layer'}
							disabled={!controller.editingReady}
							onclick={() => controller.toggleFrameVisibility(frame.id)}
						>
							{#if metadata.visible}<Eye size={13} />{:else}<EyeOff size={13} />{/if}
						</button>
						<button
							class={['row-action', metadata.locked && 'is-active']}
							type="button"
							aria-label={`${metadata.locked ? 'Unlock' : 'Lock'} ${frame.title}`}
							aria-pressed={metadata.locked}
							title={metadata.locked ? 'Unlock layer' : 'Lock layer'}
							disabled={!controller.editingReady}
							onclick={() => controller.toggleFrameLock(frame.id)}
						>
							{#if metadata.locked}<Lock size={13} />{:else}<Unlock size={13} />{/if}
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</nav>

<style>
	.layers-panel {
		position: relative;
		z-index: 30;
		flex: 0 0 244px;
		width: 244px;
		border-right: 1px solid #d7d9dd;
		background: #f7f8fa;
		color: #2a2d32;
		box-shadow: 1px 0 0 rgb(255 255 255 / 72%);
		transition:
			flex-basis 140ms ease,
			width 140ms ease;
	}

	.layers-panel.is-collapsed {
		flex-basis: 40px;
		width: 40px;
		overflow: hidden;
	}

	.panel-heading {
		display: flex;
		height: 40px;
		align-items: center;
		justify-content: space-between;
		padding: 0 7px 0 12px;
		border-bottom: 1px solid #dcdee2;
		background: #fbfbfc;
	}

	.panel-heading__label {
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.01em;
	}

	.panel-toggle,
	.row-action {
		display: grid;
		border: 0;
		place-items: center;
		border-radius: 4px;
		background: transparent;
		color: #5f636b;
	}

	.panel-toggle {
		width: 28px;
		height: 28px;
	}

	.panel-toggle:hover,
	.panel-toggle:focus-visible,
	.row-action:hover,
	.row-action:focus-visible {
		background: #e8eaed;
		color: #202328;
	}

	.panel-toggle:focus-visible,
	.layer-select:focus-visible,
	.row-action:focus-visible {
		outline: 2px solid var(--figma-blue);
		outline-offset: -2px;
	}

	.is-collapsed .panel-heading {
		justify-content: center;
		padding: 0;
	}

	.is-collapsed .panel-heading__label {
		display: none;
	}

	.page-heading {
		display: grid;
		grid-template-columns: 14px 15px minmax(0, 1fr);
		height: 34px;
		align-items: center;
		gap: 4px;
		padding: 0 8px;
		border-bottom: 1px solid #e4e5e8;
		color: #3b3f45;
		font-size: 11px;
		font-weight: 600;
	}

	.layer-tree {
		height: calc(100% - 75px);
		padding: 5px 5px 18px;
		overflow: auto;
	}

	.layer-row {
		display: flex;
		min-width: 0;
		height: 30px;
		align-items: center;
		border-radius: 4px;
		color: #444850;
	}

	.layer-row:hover,
	.layer-row.is-hovered {
		background: #eceef1;
	}

	.layer-row.is-selected {
		background: #dcecff;
		color: #075b9a;
	}

	.layer-row.is-hidden .layer-select {
		color: #5f636b;
	}

	.layer-row.is-hidden .kind-icon {
		color: #8a8f98;
	}

	.layer-select {
		display: flex;
		min-width: 0;
		flex: 1;
		height: 100%;
		align-items: center;
		gap: 6px;
		padding: 0 3px 0 22px;
		border: 0;
		border-radius: 4px 0 0 4px;
		background: transparent;
		color: inherit;
		font: inherit;
		font-size: 11px;
		text-align: left;
	}

	.kind-icon {
		display: grid;
		flex: none;
		place-items: center;
		color: #71767f;
	}

	.is-selected .kind-icon {
		color: #1477bb;
	}

	.layer-name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.layer-actions {
		display: flex;
		flex: none;
		align-items: center;
		padding-right: 2px;
	}

	.row-action {
		width: 26px;
		height: 26px;
		opacity: 0;
	}

	.layer-row:hover .row-action,
	.layer-row:focus-within .row-action,
	.row-action.is-active {
		opacity: 1;
	}

	.row-action.is-active {
		color: #2f343b;
	}

	.row-action:disabled {
		cursor: not-allowed;
		opacity: 0.28;
	}

	@media (prefers-reduced-motion: reduce) {
		.layers-panel {
			transition: none;
		}
	}

	@media (max-width: 800px) {
		.layers-panel {
			display: none;
		}
	}
</style>
