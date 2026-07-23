<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		id,
		label,
		title,
		x,
		y,
		width,
		height,
		selected = false,
		dragging = false,
		onpointerdown,
		onfocus,
		children
	}: {
		id: string;
		label: string;
		title: string;
		x: number;
		y: number;
		width: number;
		height: number;
		selected?: boolean;
		dragging?: boolean;
		onpointerdown: (event: PointerEvent) => void;
		onfocus: () => void;
		children: Snippet;
	} = $props();
</script>

<article
	class={['canvas-frame', selected && 'is-selected', dragging && 'is-dragging']}
	data-frame-id={id}
	aria-label={`${label}: ${title}`}
	data-selected={selected ? '' : undefined}
	role="group"
	tabindex="-1"
	style:width={`${width}px`}
	style:height={`${height}px`}
	style:transform={`translate3d(${x}px, ${y}px, 0)`}
	{onpointerdown}
	{onfocus}
>
	<div class="frame-label" aria-hidden="true">
		<span>{label}</span>
		<span class="frame-label__name">{title}</span>
	</div>
	<div class="frame-content">
		{@render children()}
	</div>
	{#if selected}
		<span class="selection-handle selection-handle--nw" aria-hidden="true"></span>
		<span class="selection-handle selection-handle--ne" aria-hidden="true"></span>
		<span class="selection-handle selection-handle--sw" aria-hidden="true"></span>
		<span class="selection-handle selection-handle--se" aria-hidden="true"></span>
	{/if}
</article>

<style>
	.canvas-frame {
		position: absolute;
		top: 0;
		left: 0;
		margin: 0;
		background: var(--canvas-surface, #fff);
		box-shadow: 0 1px 2px rgb(0 0 0 / 8%);
		outline: 0 solid transparent;
		transform-origin: top left;
		user-select: none;
		will-change: transform;
	}
	.canvas-frame::after {
		position: absolute;
		inset: -1px;
		border: 1px solid rgb(0 0 0 / 8%);
		content: '';
		pointer-events: none;
	}
	.canvas-frame.is-selected {
		z-index: 2;
		box-shadow: 0 8px 30px rgb(0 0 0 / 13%);
		outline: 2px solid var(--figma-blue, #0d99ff);
	}
	.canvas-frame.is-dragging {
		z-index: 3;
		cursor: grabbing;
	}
	.canvas-frame:focus-visible {
		outline: 3px solid var(--figma-blue, #0d99ff);
		outline-offset: 4px;
	}
	.frame-label {
		position: absolute;
		bottom: calc(100% + 8px);
		left: 0;
		display: flex;
		align-items: center;
		gap: 8px;
		color: #494949;
		font-size: 12px;
		font-weight: 600;
		line-height: 1;
		white-space: nowrap;
	}
	.is-selected .frame-label {
		color: var(--figma-blue, #0d99ff);
	}
	.frame-label__name {
		max-width: 280px;
		overflow: hidden;
		font-weight: 400;
		text-overflow: ellipsis;
	}
	.frame-content {
		height: 100%;
		overflow: hidden;
		user-select: text;
	}
	.selection-handle {
		position: absolute;
		z-index: 4;
		width: 8px;
		height: 8px;
		border: 1.5px solid var(--figma-blue, #0d99ff);
		background: white;
		pointer-events: none;
	}
	.selection-handle--nw {
		top: -5px;
		left: -5px;
	}
	.selection-handle--ne {
		top: -5px;
		right: -5px;
	}
	.selection-handle--sw {
		bottom: -5px;
		left: -5px;
	}
	.selection-handle--se {
		right: -5px;
		bottom: -5px;
	}
	@media (prefers-reduced-motion: reduce) {
		.canvas-frame {
			will-change: auto;
		}
	}
</style>
