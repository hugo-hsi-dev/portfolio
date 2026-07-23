<script lang="ts">
	let {
		name,
		color,
		x,
		y,
		reducedMotion = false
	}: { name: string; color: string; x: number; y: number; reducedMotion?: boolean } = $props();
</script>

<div
	class={['multiplayer-cursor', reducedMotion && 'reduced-motion']}
	style:transform={`translate3d(${x}px, ${y}px, 0)`}
	aria-hidden="true"
>
	<svg viewBox="0 0 24 28" width="20" height="24" fill="none">
		<path
			d="M2.5 2.4 20.7 15c.9.7.5 2.1-.7 2.2l-7.4.6-3.9 6.3c-.6 1-2.1.6-2.2-.5L.5 3.8c-.4-1.3.9-2.1 2-1.4Z"
			fill={color}
			stroke="white"
			stroke-width="1.5"
		/>
	</svg>
	<span style:background={color}>{name}</span>
</div>

<style>
	.multiplayer-cursor {
		position: absolute;
		top: 0;
		left: 0;
		z-index: 20;
		display: flex;
		align-items: flex-start;
		pointer-events: none;
		transition: transform 70ms linear;
		will-change: transform;
	}

	.multiplayer-cursor svg {
		flex: none;
		filter: drop-shadow(0 1px 1px rgb(0 0 0 / 18%));
	}

	.multiplayer-cursor span {
		margin-top: 17px;
		margin-left: -3px;
		border-radius: 3px;
		color: white;
		font-size: 11px;
		font-weight: 600;
		line-height: 20px;
		padding-inline: 6px;
		white-space: nowrap;
		box-shadow: 0 1px 2px rgb(0 0 0 / 12%);
	}

	.multiplayer-cursor.reduced-motion {
		transition: none;
	}
</style>
