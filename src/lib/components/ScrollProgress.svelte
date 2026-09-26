<script lang="ts">
	import { onMount } from 'svelte';

	let indicator: HTMLSpanElement;

	onMount(() => {
		if (CSS.supports('animation-timeline', 'scroll(root block)')) return;
		// Older browsers can drive the same native animation with scroll position.
		const animation = indicator.animate([{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], {
			duration: 1,
			fill: 'both'
		});
		animation.pause();
		let frame = 0;
		/** Map the current document scroll fraction onto the paused native animation. */
		const update = () => {
			frame = 0;
			const distance = document.documentElement.scrollHeight - window.innerHeight;
			animation.currentTime =
				distance > 0 ? Math.min(1, Math.max(0, window.scrollY / distance)) : 0;
		};
		/** Coalesce scroll and resize notifications into one update per animation frame. */
		const scheduleUpdate = () => {
			if (!frame) frame = requestAnimationFrame(update);
		};
		const resizeObserver = new ResizeObserver(scheduleUpdate);
		resizeObserver.observe(document.body);
		window.addEventListener('scroll', scheduleUpdate, { passive: true });
		window.addEventListener('resize', scheduleUpdate);
		update();
		return () => {
			cancelAnimationFrame(frame);
			animation.cancel();
			resizeObserver.disconnect();
			window.removeEventListener('scroll', scheduleUpdate);
			window.removeEventListener('resize', scheduleUpdate);
		};
	});
</script>

<div
	class="pointer-events-none fixed inset-y-0 left-2 z-40 w-0.5 bg-cream-lighter motion-reduce:hidden lg:left-6"
	aria-hidden="true"
>
	<span
		bind:this={indicator}
		class="block size-full origin-top [transform:scaleY(0)] bg-gold supports-[animation-timeline:scroll(root_block)]:animate-scroll-progress supports-[animation-timeline:scroll(root_block)]:[animation-duration:auto] supports-[animation-timeline:scroll(root_block)]:[animation-timeline:scroll(root_block)]"
	></span>
</div>
