<script lang="ts">
	import { prefersReducedMotion, Tween } from 'svelte/motion';

	let { text }: { text: string } = $props();
	const characters = new Tween(0);
	let typing = $state(false);
	const visibleLength = $derived(typing ? Math.floor(characters.current) : text.length);
	let initialized = false;

	$effect(() => {
		const length = text.length;
		const reducedMotion = prefersReducedMotion.current;
		const animate = !initialized && !reducedMotion && window.scrollY < window.innerHeight;
		typing = animate;
		initialized = true;
		void characters.set(length, animate ? { delay: 300, duration: length * 35 } : { duration: 0 });
		return () => {
			void characters.set(length, { duration: 0 });
		};
	});
</script>

<span class="sr-only">{text}</span>
<span aria-hidden="true"
	>{text.slice(0, visibleLength)}{#if typing}<span
			class="relative inline after:absolute after:bottom-[0.08em] after:left-1 after:h-[1cap] after:w-0.5 after:animate-cursor-blink after:bg-current after:content-[''] motion-reduce:hidden"
		></span>{/if}<span class="invisible">{text.slice(visibleLength)}</span></span
>
