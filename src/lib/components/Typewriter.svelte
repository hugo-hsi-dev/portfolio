<script lang="ts">
	let {
		text,
		delay = 300,
		interval = 35
	}: { text: string; delay?: number; interval?: number } = $props();

	const characters = $derived([...text]);
</script>

<!-- Each character appears after its own animation delay; its ::after is the caret while it is the newest character. -->
<span class="sr-only">{text}</span><span aria-hidden="true"
	>{#each characters as character, index (index)}<span
			style:--type-delay="{delay + index * interval}ms"
			class="relative animate-type after:absolute after:bottom-[0.08em] after:left-[calc(100%+4px)] after:h-[1cap] after:w-0.5 after:animate-caret after:bg-current after:opacity-0 last:after:animate-caret-blink"
			>{character}</span
		>{/each}</span
>
