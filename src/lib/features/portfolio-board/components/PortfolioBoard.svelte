<script lang="ts">
	import type { CanvasDocument, PortfolioContent } from '$lib/features/portfolio-content';

	import { PortfolioBoardController } from '../board-controller.svelte';
	import BoardControls from './BoardControls.svelte';
	import BoardTopbar from './BoardTopbar.svelte';
	import BoardViewport from './BoardViewport.svelte';
	import BrowseDialog from './BrowseDialog.svelte';
	import LayersPanel from './LayersPanel.svelte';
	import PropertiesPanel from './PropertiesPanel.svelte';
	import ResetDialog from './ResetDialog.svelte';
	import ShortcutDialog from './ShortcutDialog.svelte';

	let { content, document }: { content: PortfolioContent; document: CanvasDocument } = $props();

	function createController(): PortfolioBoardController {
		return new PortfolioBoardController(document);
	}

	const controller = createController();
</script>

<svelte:window onkeydown={controller.onKeydown} onkeyup={controller.onKeyup} />

<a class="skip-link" href="#main">Skip to portfolio content</a>

<main class="portfolio-file" id="main" tabindex="-1">
	<BoardTopbar {content} {controller} />
	<div class="workspace">
		<LayersPanel {controller} />
		<div class="viewport-stage">
			<BoardViewport {controller} />
			<BoardControls {controller} />
		</div>
		<PropertiesPanel {controller} />
	</div>
</main>

<BrowseDialog {content} {controller} />
<ResetDialog {controller} />
<ShortcutDialog {controller} />

<style>
	.portfolio-file {
		height: 100dvh;
		overflow: hidden;
		background: var(--canvas-background);
	}
	.workspace {
		position: relative;
		display: flex;
		height: calc(100dvh - 48px);
		overflow: hidden;
	}
	.viewport-stage {
		position: relative;
		display: flex;
		flex: 1;
		min-width: 0;
		overflow: hidden;
	}
	@media (max-width: 800px) {
		.workspace {
			height: calc(100dvh - 46px);
		}
	}
</style>
