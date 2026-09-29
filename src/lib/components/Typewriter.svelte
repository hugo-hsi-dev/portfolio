<script lang="ts">
	import { onMount } from 'svelte';

	let { text, onComplete }: { text: string; onComplete?: () => void } = $props();
	let visibleLength = $state<number | null>(null);
	let showCursor = $state(false);

	onMount(() => {
		const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
		let timer: ReturnType<typeof setTimeout>;
		let completed = false;
		/** Stop typing and display the full text without its animated cursor. */
		const complete = () => {
			clearTimeout(timer);
			visibleLength = null;
			showCursor = false;
			if (!completed) {
				completed = true;
				onComplete?.();
			}
		};
		/** Reveal one character and schedule the next until the text is complete. */
		const typeNext = () => {
			visibleLength = (visibleLength ?? 0) + 1;
			if (visibleLength < text.length) timer = setTimeout(typeNext, 35);
			else complete();
		};
		if (!preference.matches && window.scrollY < window.innerHeight) {
			visibleLength = 0;
			showCursor = true;
			timer = setTimeout(typeNext, 300);
		} else complete();
		/** Finish immediately if reduced motion is enabled during typing. */
		const updatePreference = () => {
			if (preference.matches) complete();
		};
		preference.addEventListener('change', updatePreference);
		return () => {
			clearTimeout(timer);
			preference.removeEventListener('change', updatePreference);
		};
	});
</script>

<span class="sr-only">{text}</span>
<span aria-hidden="true"
	>{text.slice(0, visibleLength ?? text.length)}{#if showCursor}<span
			class="relative inline after:absolute after:bottom-[0.08em] after:left-1 after:h-[1cap] after:w-0.5 after:animate-cursor-blink after:bg-current after:content-[''] motion-reduce:hidden"
		></span>{/if}<span class="invisible">{text.slice(visibleLength ?? text.length)}</span></span
>
