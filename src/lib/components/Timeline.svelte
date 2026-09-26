<script lang="ts">
	import { reveal, revealClasses } from '$lib/attachments/reveal';
	import type { TimelineEntry } from '$lib/content';

	let { entries }: { entries: TimelineEntry[] } = $props();
</script>

<div
	class="relative grid gap-16 before:absolute before:inset-y-2 before:left-[19px] before:w-px before:bg-border"
>
	{#each entries as entry (entry.title)}
		<article
			class={[
				'relative pl-12 before:absolute before:top-[7px] before:left-[18px] before:size-[3px] before:rounded-full before:bg-stone',
				revealClasses
			]}
			{@attach reveal}
		>
			<p class="mb-2 text-xs/normal tracking-label text-stone uppercase">{entry.date}</p>
			<h3 class="mb-1 font-serif text-xl/[1.3] lg:text-2xl/[1.3]">{entry.title}</h3>
			<p class="mb-3 text-gold">{entry.organization}</p>
		</article>
	{/each}
</div>
