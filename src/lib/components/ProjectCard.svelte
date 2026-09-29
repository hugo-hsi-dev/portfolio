<script lang="ts">
	import TextLink from './TextLink.svelte';
	import { reveal } from '$lib/actions/reveal';
	import type { Project } from '$lib/data/portfolio';
	let { project }: { project: Project } = $props();
</script>

{#snippet heading(technical = false)}
	<span
		class={[
			'mb-3 block text-xs leading-normal tracking-[0.2em] uppercase',
			project.accent === 'sage' ? 'text-sage-on-cream' : 'text-gold-on-cream'
		]}>{project.category}</span
	>
	<h3
		class={[
			'font-serif leading-[1.2] font-normal',
			technical ? 'text-3xl' : 'mb-3 text-2xl lg:text-3xl'
		]}
	>
		{project.title}
	</h3>
{/snippet}

<article
	use:reveal
	class={[
		'group/project grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8',
		project.image
			? 'transition-[translate,box-shadow] duration-300 ease-out motion-reduce:transition-none [@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-1 [@media(hover:hover)_and_(pointer:fine)]:hover:shadow-[0_10px_15px_-3px_rgb(0_0_0/8%)]'
			: 'border-t border-cream-lighter pt-8'
	]}
>
	<!-- eslint-disable svelte/no-navigation-without-resolve -- Project URLs are external destinations. -->
	{#if project.image}
		<svelte:element
			this={project.url ? 'a' : 'div'}
			class={[
				'flex aspect-video min-w-0 items-center justify-center overflow-hidden text-center font-serif text-lg text-stone-light shadow-[0_0_0_1px_rgb(0_0_0/8%)] lg:col-span-7',
				project.accent === 'sage' ? 'bg-cream-light' : 'bg-cream-lighter'
			]}
			href={project.url}
			aria-label={project.url ? `Visit ${project.title}` : undefined}
		>
			<img
				class={[
					'h-full w-full object-top transition-transform duration-400 motion-reduce:transition-none [@media(hover:hover)_and_(pointer:fine)]:group-hover/project:scale-[1.025]',
					project.image.fit === 'logo' ? 'bg-[#dadada] object-contain p-6' : 'object-cover'
				]}
				src={project.image.src}
				alt={project.image.alt}
				width="1440"
				height="960"
				loading="lazy"
			/>
		</svelte:element>
	{:else}
		<div class="lg:col-span-5">{@render heading(true)}</div>
	{/if}
	<div class={project.image ? 'lg:col-span-5 lg:pt-4' : 'lg:col-span-7'}>
		{#if project.image}{@render heading()}{/if}
		<p class="mb-4 leading-[1.625] text-slate">{project.description}</p>
		<ul class="mb-4 flex list-none flex-wrap gap-2 p-0">
			{#each project.technologies as technology (technology)}<li
					class="bg-cream-lighter px-2 py-1 text-xs leading-4 text-slate"
				>
					{technology}
				</li>{/each}
		</ul>
		{#if project.url}
			<TextLink href={project.url} aria-label={`Visit site: ${project.title}`} arrow
				>Visit site</TextLink
			>
		{/if}
	</div>
	<!-- eslint-enable svelte/no-navigation-without-resolve -->
</article>
