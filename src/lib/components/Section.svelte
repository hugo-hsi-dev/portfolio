<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'svelte/elements';
	import { reveal } from '$lib/actions/reveal';

	let {
		id,
		title,
		class: className,
		headerAside,
		children
	}: {
		id: string;
		title: string;
		class?: ClassValue;
		headerAside?: Snippet;
		children: Snippet;
	} = $props();
</script>

<section
	{id}
	class={['py-24 pr-6 pl-8 lg:px-12 lg:py-32', className]}
	aria-labelledby={`${id}-title`}
>
	<div class="mx-auto w-full max-w-6xl">
		<header
			use:reveal
			class="mb-16 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-4 max-[420px]:gap-3"
		>
			<h2
				id={`${id}-title`}
				class="max-w-2xl font-serif text-4xl leading-[1.1] font-normal tracking-tight lg:text-5xl"
			>
				{title}
			</h2>
			{@render headerAside?.()}
		</header>
		{@render children()}
	</div>
</section>
