<script lang="ts">
	import {
		Focus,
		Hand,
		Keyboard,
		List,
		Minus,
		MousePointer2,
		Plus,
		Redo2,
		Scan,
		Undo2
	} from '@lucide/svelte';

	import type { PortfolioBoardController } from '../board-controller.svelte';

	let { controller }: { controller: PortfolioBoardController } = $props();
</script>

<div class="tool-controls" role="toolbar" aria-label="Canvas tools">
	<button
		type="button"
		class:is-active={controller.tool === 'move' && !controller.spacePanning}
		aria-label="Select tool"
		aria-pressed={controller.tool === 'move'}
		title="Select · V"
		onclick={() => controller.setTool('move')}
	>
		<MousePointer2 size={15} strokeWidth={1.8} />
		<span>Select</span>
		<kbd>V</kbd>
	</button>
	<button
		type="button"
		class:is-active={controller.tool === 'hand' || controller.spacePanning}
		aria-label="Hand tool"
		aria-pressed={controller.tool === 'hand'}
		title="Hand · H or Space"
		onclick={() => controller.setTool('hand')}
	>
		<Hand size={15} strokeWidth={1.8} />
		<span>Hand</span>
		<kbd>H</kbd>
	</button>
	<span class="tool-divider desktop-only" aria-hidden="true"></span>
	<button
		class="icon-tool desktop-only"
		type="button"
		aria-label="Undo"
		title="Undo · ⌘Z"
		disabled={!controller.canUndo}
		onclick={controller.undo}
	>
		<Undo2 size={15} />
	</button>
	<button
		class="icon-tool desktop-only"
		type="button"
		aria-label="Redo"
		title="Redo · ⇧⌘Z"
		disabled={!controller.canRedo}
		onclick={controller.redo}
	>
		<Redo2 size={15} />
	</button>
	<span class="tool-divider" aria-hidden="true"></span>
	<button
		type="button"
		aria-label="Browse portfolio"
		title="Browse the portfolio in reading order"
		onclick={() => (controller.browseOpen = true)}
	>
		<List size={15} />
		<span>Browse</span>
	</button>
	<button
		class="icon-tool desktop-only"
		type="button"
		aria-label="Keyboard shortcuts"
		title="Keyboard shortcuts · ?"
		onclick={() => (controller.shortcutDialogOpen = true)}
	>
		<Keyboard size={15} />
	</button>
</div>

<div class="zoom-controls" aria-label="Zoom controls">
	<button
		type="button"
		aria-label="Zoom out"
		title="Zoom out"
		onclick={() => controller.setZoom(controller.camera.zoom / 1.2)}
	>
		<Minus size={15} />
	</button>
	<span aria-live="polite">{controller.zoomPercent}%</span>
	<button
		type="button"
		aria-label="Zoom in"
		title="Zoom in"
		onclick={() => controller.setZoom(controller.camera.zoom * 1.2)}
	>
		<Plus size={15} />
	</button>
	<span class="zoom-divider" aria-hidden="true"></span>
	<button
		type="button"
		aria-label="Fit selection"
		title="Fit selection · ⇧2"
		disabled={controller.selectedFrameIds.length === 0}
		onclick={controller.fitSelection}
	>
		<Focus size={15} />
	</button>
	<button type="button" aria-label="Fit all" title="Fit all · ⇧1" onclick={controller.fitAll}>
		<Scan size={15} />
	</button>
</div>

<style>
	.tool-controls,
	.zoom-controls {
		position: absolute;
		z-index: 35;
		bottom: 14px;
		display: flex;
		align-items: center;
		height: 36px;
		padding: 3px;
		border: 1px solid #3f3f3f;
		border-radius: 7px;
		background: rgb(44 44 44 / 97%);
		color: #f4f4f4;
		box-shadow: 0 3px 12px rgb(0 0 0 / 20%);
	}
	.tool-controls {
		left: 50%;
		transform: translateX(-50%);
	}
	.zoom-controls {
		right: 14px;
		border-color: #c8c8c8;
		background: rgb(255 255 255 / 97%);
		color: #444;
	}
	button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		min-width: 30px;
		height: 28px;
		padding: 0 8px;
		border: 0;
		border-radius: 4px;
		background: transparent;
		color: inherit;
		font-size: 11px;
		font-weight: 500;
		white-space: nowrap;
	}
	button:hover:not(:disabled) {
		background: rgb(255 255 255 / 10%);
	}
	.zoom-controls button:hover:not(:disabled) {
		background: #ececec;
	}
	button.is-active {
		background: #0869a8;
		color: white;
	}
	button:disabled {
		opacity: 0.35;
	}
	.icon-tool {
		padding: 0;
	}
	kbd {
		color: rgb(255 255 255 / 52%);
		font: inherit;
		font-size: 9px;
	}
	.is-active kbd {
		color: rgb(255 255 255 / 78%);
	}
	.tool-divider,
	.zoom-divider {
		width: 1px;
		height: 18px;
		margin-inline: 3px;
		background: #4b4b4b;
	}
	.zoom-divider {
		background: #d8d8d8;
	}
	.zoom-controls > span:not(.zoom-divider) {
		min-width: 43px;
		font-size: 11px;
		text-align: center;
		font-variant-numeric: tabular-nums;
	}
	@media (max-width: 760px) {
		.tool-controls,
		.zoom-controls {
			bottom: 10px;
			height: 52px;
		}
		.tool-controls {
			left: 10px;
			transform: none;
		}
		.tool-controls button,
		.zoom-controls button {
			min-width: 44px;
			height: 44px;
		}
		.tool-controls button span,
		.tool-controls kbd,
		.desktop-only {
			display: none;
		}
		.zoom-controls {
			right: 10px;
		}
		.zoom-controls > span:not(.zoom-divider),
		.zoom-controls button:first-child,
		.zoom-controls button:nth-of-type(2) {
			display: none;
		}
	}
</style>
