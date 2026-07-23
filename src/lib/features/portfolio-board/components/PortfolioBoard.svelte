<script lang="ts">
	import type { CanvasDocument, PortfolioContent } from '$lib/features/portfolio-content';

	import { PortfolioBoardController } from '../board-controller.svelte';
	import BoardControls from './BoardControls.svelte';
	import BoardTopbar from './BoardTopbar.svelte';
	import BoardViewport from './BoardViewport.svelte';
	import BrowseDialog from './BrowseDialog.svelte';
	import LayersPanel from './LayersPanel.svelte';
	import ResetDialog from './ResetDialog.svelte';

	let { content, document }: { content: PortfolioContent; document: CanvasDocument } = $props();

	let controller = $derived(new PortfolioBoardController(document));
</script>

<svelte:window onkeydown={controller.onKeydown} />

<a class="skip-link" href="#main">Skip to portfolio content</a>

<main class="portfolio-file" id="main" tabindex="-1">
	<BoardTopbar {content} {controller} />
	<div class="workspace">
		<LayersPanel {controller} />
		<BoardViewport {controller} />
		<BoardControls {controller} />
	</div>
</main>

<BrowseDialog {content} {controller} />
<ResetDialog {controller} />

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
	@media (max-width: 800px) {
		.workspace {
			height: calc(100dvh - 46px);
		}
	}
</style>
