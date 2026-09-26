<script lang="ts">
	import Section from './Section.svelte';
	import { reveal } from '$lib/actions/reveal';
	import type { TimelineEntry } from '$lib/data/portfolio';
	let {
		id,
		title,
		items,
		divided = false
	}: { id: string; title: string; items: TimelineEntry[]; divided?: boolean } = $props();
</script>

<Section {id} {title} class={['bg-charcoal text-cream', divided && 'border-t border-border']}>
	<div
		class="relative grid gap-16 before:absolute before:top-2 before:bottom-2 before:left-[19px] before:w-px before:bg-border"
	>
		{#each items as item (item.company)}
			<article
				use:reveal
				class="relative pl-12 before:absolute before:top-[7px] before:left-[18px] before:size-[3px] before:rounded-full before:bg-stone"
			>
				<p class="mb-2 block text-xs leading-normal tracking-[0.2em] text-stone uppercase">
					{item.date}
				</p>
				<h3 class="mb-1 font-serif text-xl leading-[1.3] font-normal lg:text-2xl">{item.role}</h3>
				<p class="mb-3 text-base text-gold">{item.company}</p>
			</article>
		{/each}
	</div>
</Section>
