<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';

	let {
		children,
		delay = 0,
		className = ''
	}: { children: Snippet; delay?: number; className?: string } = $props();

	const reveal: Attachment<HTMLElement> = (element) => {
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		element.dataset.reveal = 'pending';
		const observer = new IntersectionObserver(
			([entry]) => {
				if (!entry?.isIntersecting) return;
				element.dataset.reveal = 'visible';
				observer.disconnect();
			},
			{ threshold: 0.1, rootMargin: '0px 0px -8% 0px' }
		);

		observer.observe(element);
		return () => observer.disconnect();
	};
</script>

<div class={['reveal', className]} style:--reveal-delay={`${delay}ms`} {@attach reveal}>
	{@render children()}
</div>

<style>
	.reveal:global([data-reveal='pending']) {
		opacity: 0;
		transform: translateY(0.875rem);
	}

	.reveal:global([data-reveal='visible']) {
		opacity: 1;
		transform: translateY(0);
		transition:
			opacity 420ms var(--ease-out) var(--reveal-delay),
			transform 420ms var(--ease-out) var(--reveal-delay);
	}

	@media (prefers-reduced-motion: reduce) {
		.reveal {
			opacity: 1;
			transform: none;
			transition: none;
		}
	}
</style>
