<script lang="ts">
	import { asset } from '$app/paths';
	import { ExternalLink } from '@lucide/svelte';
	import type { MarkdownDocument, ProjectContent } from '$lib/server/content';

	let {
		project,
		priority = false
	}: { project: MarkdownDocument<ProjectContent>; priority?: boolean } = $props();

	let imageUrl = $derived(
		project.metadata.featuredImage ? asset(project.metadata.featuredImage) : undefined
	);
	let category = $derived(
		project.metadata.context === 'work'
			? `Client work at ${project.metadata.company}`
			: 'Personal project'
	);
</script>

{#snippet content()}
	<div class={['project-image', `project-image--${project.metadata.context}`]}>
		{#if imageUrl}
			<img
				src={imageUrl}
				alt={project.metadata.featuredImageAlt ?? ''}
				width="1600"
				height="900"
				loading={priority ? 'eager' : 'lazy'}
				fetchpriority={priority ? 'high' : 'auto'}
				decoding="async"
			/>
		{:else}
			<span>{project.metadata.title}</span>
		{/if}
	</div>

	<div class="project-copy">
		<p class={['category', project.metadata.context === 'personal' && 'category--personal']}>
			{category}
		</p>
		<h3>{project.metadata.title}</h3>
		<p class="excerpt">{project.metadata.excerpt}</p>
		{#if project.metadata.technologies.length}
			<ul aria-label="Technologies">
				{#each project.metadata.technologies as technology (technology)}
					<li>{technology}</li>
				{/each}
			</ul>
		{/if}
		{#if project.metadata.liveUrl}
			<span class="visit">
				<span>Visit site</span>
				<ExternalLink size={15} strokeWidth={1.75} aria-hidden="true" />
			</span>
		{/if}
	</div>
{/snippet}

<article>
	{#if project.metadata.liveUrl}
		<a
			class="project-layout"
			href={project.metadata.liveUrl}
			target="_blank"
			rel="noopener noreferrer"
			aria-label={`Visit ${project.metadata.title} website`}
		>
			{@render content()}
		</a>
	{:else}
		<div class="project-layout">
			{@render content()}
		</div>
	{/if}
</article>

<style>
	article {
		transition: transform 240ms var(--ease-out);
	}

	article:has(a:hover) {
		transform: translateY(-0.25rem);
	}

	.project-layout {
		display: grid;
		gap: 1.75rem;
	}

	.project-image {
		display: grid;
		overflow: hidden;
		aspect-ratio: 16 / 9;
		place-items: center;
		background: var(--color-cream-lighter);
		box-shadow: inset 0 0 0 1px rgb(26 26 26 / 0.1);
	}

	.project-image--personal {
		background: var(--color-cream-light);
	}

	.project-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 320ms var(--ease-out);
	}

	a:hover .project-image img {
		transform: scale(1.025);
	}

	.project-image > span {
		padding: 2rem;
		color: var(--color-stone-light);
		font-family: var(--font-serif);
		font-size: 1.25rem;
		text-align: center;
	}

	.project-copy {
		padding-block-start: 0.25rem;
	}

	.category {
		margin: 0 0 0.75rem;
		color: var(--color-gold-dark);
		font-size: 0.75rem;
		font-weight: 500;
		text-transform: uppercase;
	}

	.category--personal {
		color: var(--color-sage-dark);
	}

	h3 {
		margin: 0 0 0.75rem;
		font-family: var(--font-serif);
		font-size: 2rem;
		font-weight: 400;
		line-height: 1.08;
	}

	.excerpt {
		margin: 0 0 1rem;
		color: var(--color-slate);
		line-height: 1.7;
	}

	ul {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin: 0 0 1.25rem;
		padding: 0;
		list-style: none;
	}

	li {
		background: var(--color-cream-lighter);
		color: var(--color-slate);
		padding: 0.35rem 0.55rem;
		font-size: 0.75rem;
	}

	.visit {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.875rem;
	}

	.visit > span {
		position: relative;
	}

	.visit > span::after {
		position: absolute;
		right: 0;
		bottom: -2px;
		left: 0;
		height: 1px;
		background: currentColor;
		content: '';
		transform: scaleX(0);
		transform-origin: left;
		transition: transform 220ms var(--ease-out);
	}

	a:hover .visit > span::after {
		transform: scaleX(1);
	}

	@media (min-width: 64rem) {
		.project-layout {
			grid-template-columns: minmax(0, 7fr) minmax(18rem, 5fr);
			gap: 2rem;
		}

		.project-copy {
			padding-block-start: 1rem;
		}

		h3 {
			font-size: 2.5rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		article,
		.project-image img,
		.visit > span::after {
			transition: none;
		}

		article:has(a:hover),
		a:hover .project-image img {
			transform: none;
		}
	}
</style>
