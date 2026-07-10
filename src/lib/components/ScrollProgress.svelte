<div class="progress" aria-hidden="true">
	<span></span>
</div>

<style>
	.progress {
		position: fixed;
		z-index: 40;
		top: 0;
		bottom: 0;
		left: 0.5rem;
		width: 2px;
		background: var(--color-cream-lighter);
		pointer-events: none;
	}

	span {
		display: block;
		width: 100%;
		height: 100%;
		background: var(--color-gold);
		transform: scaleY(0);
		transform-origin: top;
	}

	@supports (animation-timeline: scroll()) {
		span {
			animation: fill-progress linear both;
			animation-timeline: scroll(root block);
		}
	}

	@keyframes fill-progress {
		to {
			transform: scaleY(1);
		}
	}

	@media (min-width: 64rem) {
		.progress {
			left: 1.5rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.progress {
			display: none;
		}
	}
</style>
