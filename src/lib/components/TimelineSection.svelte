<script lang="ts">
	import { reveal } from '$lib/actions/reveal';
	import type { TimelineEntry } from '$lib/data/portfolio';
	let {
		id,
		title,
		items,
		divided = false
	}: { id: string; title: string; items: TimelineEntry[]; divided?: boolean } = $props();
</script>

<section
	{id}
	class={[
		'bg-charcoal py-24 pr-6 pl-8 text-cream lg:px-12 lg:py-32',
		divided && 'border-t border-border'
	]}
	aria-labelledby={`${id}-title`}
>
	<div class="mx-auto w-full max-w-6xl">
		<header
			use:reveal
			class="mb-16 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-4 max-[420px]:gap-3"
		>
			<h2
				id={`${id}-title`}
				class="font-serif text-4xl leading-[1.1] font-normal tracking-tight lg:text-5xl"
			>
				{title}
			</h2>
		</header>
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
	</div>
</section>
