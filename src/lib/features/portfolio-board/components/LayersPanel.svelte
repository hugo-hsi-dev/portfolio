<script lang="ts">
	import { BriefcaseBusiness, FileText, GraduationCap, Layers3, Sparkles, X } from '@lucide/svelte';

	import type { PortfolioBoardController } from '../board-controller.svelte';

	let { controller }: { controller: PortfolioBoardController } = $props();
</script>

<nav class={['layers-panel', !controller.layersOpen && 'is-collapsed']} aria-label="Layers">
	<div class="panel-heading">
		<span>Layers</span>
		<button
			type="button"
			aria-label="Toggle layers"
			aria-expanded={controller.layersOpen}
			onclick={() => (controller.layersOpen = !controller.layersOpen)}
		>
			{#if controller.layersOpen}<X size={15} />{:else}<Layers3 size={16} />{/if}
		</button>
	</div>
	{#if controller.layersOpen}
		<div class="layer-tree">
			{#each controller.frames as frame (frame.id)}
				<button
					type="button"
					class={['layer-row', controller.selectedFrameId === frame.id && 'is-selected']}
					aria-label={`Go to ${frame.title}`}
					onclick={() => controller.goToFrame(frame)}
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

<style>
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
	.is-collapsed .panel-heading {
		justify-content: center;
		padding: 0;
	}
	.is-collapsed .panel-heading > span {
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
	@media (max-width: 800px) {
		.layers-panel {
			display: none;
		}
	}
</style>
