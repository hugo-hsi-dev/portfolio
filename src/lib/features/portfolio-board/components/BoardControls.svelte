<script lang="ts">
	import { Focus, List, Minus, Plus, Scan } from '@lucide/svelte';

	import type { PortfolioBoardController } from '../board-controller.svelte';

	let { controller }: { controller: PortfolioBoardController } = $props();
</script>

<div class="zoom-controls" aria-label="Zoom controls">
	<button
		type="button"
		aria-label="Zoom out"
		onclick={() => controller.setZoom(controller.camera.zoom / 1.2)}><Minus size={16} /></button
	>
	<span aria-live="polite">{controller.zoomPercent}%</span>
	<button
		type="button"
		aria-label="Zoom in"
		onclick={() => controller.setZoom(controller.camera.zoom * 1.2)}><Plus size={16} /></button
	>
	<span class="zoom-divider"></span>
	<button
		type="button"
		aria-label="Fit selection"
		disabled={!controller.selectedFrame}
		onclick={controller.fitSelection}><Focus size={16} /></button
	>
	<button type="button" aria-label="Fit all" onclick={controller.fitAll}><Scan size={16} /></button>
</div>

<button
	class="browse-button"
	type="button"
	aria-label="Browse portfolio"
	onclick={() => (controller.browseOpen = true)}><List size={15} /> Browse</button
>

<style>
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
	@media (max-width: 800px) {
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
	}
</style>
