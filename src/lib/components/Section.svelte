<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'svelte/elements';
	import { reveal, revealClasses } from '$lib/attachments/reveal';

	let {
		id,
		titleId,
		title,
		meta,
		tone = 'light',
		class: className,
		children
	}: {
		id?: string;
		titleId: string;
		title: string;
		meta?: string;
		tone?: 'light' | 'dark';
		class?: ClassValue;
		children: Snippet;
	} = $props();
</script>

<section
	{id}
	class={[
		'py-24 pr-6 pl-8 lg:px-12 lg:py-32',
		tone === 'dark' && 'bg-charcoal text-cream',
		className
	]}
	aria-labelledby={titleId}
>
	<div class="mx-auto w-full max-w-6xl">
		<header
			class={[
				'mb-16 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-4 max-[420px]:gap-3',
				revealClasses
			]}
			{@attach reveal}
		>
			<h2 id={titleId} class="max-w-2xl font-serif text-4xl/[1.1] tracking-tight lg:text-5xl/[1.1]">
				{title}
			</h2>
			{#if meta}<span
					class="text-xs/normal tracking-label text-stone uppercase max-[420px]:text-[10px]"
					>{meta}</span
				>{/if}
		</header>
		{@render children()}
	</div>
</section>
