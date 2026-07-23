<script lang="ts">
	/* eslint-disable svelte/no-navigation-without-resolve -- Validated external URLs are not SvelteKit routes. */
	import { ExternalLink } from '@lucide/svelte';

	import type { ProjectCanvasFrame } from '$lib/features/portfolio-content';

	let { frame }: { frame: ProjectCanvasFrame } = $props();

	function projectContextLabel(project: ProjectCanvasFrame['project']): string {
		return project.metadata.context === 'work'
			? (project.metadata.company ?? 'Client work')
			: 'Personal project';
	}
</script>

<article class="project-frame">
	{#if frame.project.metadata.featuredImage}
		<div class="project-image">
			<img
				src={frame.project.metadata.featuredImage}
				alt={frame.project.metadata.featuredImageAlt ?? ''}
				draggable="false"
			/>
		</div>
	{:else}
		<div class="project-image project-image--generated" aria-hidden="true">
			<span>$</span><span>remaining</span><strong>42%</strong>
		</div>
	{/if}
	<div class="project-copy">
		<div class="project-meta">
			<span>{projectContextLabel(frame.project)}</span><span
				>{String(frame.projectIndex + 1).padStart(2, '0')}</span
			>
		</div>
		<h2>{frame.project.metadata.title}</h2>
		<p>{frame.project.metadata.excerpt}</p>
		<div class="tag-row">
			{#each frame.project.metadata.technologies as tech (tech)}<span>{tech}</span>{/each}
		</div>
		{#if frame.project.metadata.liveUrl}<a
				class="project-link"
				href={frame.project.metadata.liveUrl}
				target="_blank"
				rel="noopener noreferrer">Visit project <ExternalLink size={14} /></a
			>{/if}
	</div>
</article>

<style>
	.project-frame {
		display: grid;
		height: 100%;
		grid-template-rows: 215px 1fr;
	}
	.project-image {
		overflow: hidden;
		background: #ddd;
	}
	.project-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		pointer-events: none;
	}
	.project-image--generated {
		display: grid;
		position: relative;
		padding: 25px;
		place-content: center;
		background: linear-gradient(135deg, #dff36b, #b6e1ff);
		color: #183221;
		text-align: center;
	}
	.project-image--generated span:first-child {
		position: absolute;
		top: 24px;
		left: 30px;
		font-family: var(--font-serif);
		font-size: 54px;
	}
	.project-image--generated span:nth-child(2) {
		font-size: 10px;
		text-transform: uppercase;
	}
	.project-image--generated strong {
		font-family: var(--font-serif);
		font-size: 70px;
		font-weight: 400;
	}
	.project-copy {
		position: relative;
		padding: 19px 24px;
	}
	.project-meta {
		display: flex;
		justify-content: space-between;
		color: #767676;
		font-size: 9px;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	.project-copy h2 {
		margin: 10px 0 5px;
		font-family: var(--font-serif);
		font-size: 29px;
		font-weight: 400;
		line-height: 1;
	}
	.project-copy > p {
		display: -webkit-box;
		max-width: 440px;
		margin: 0;
		overflow: hidden;
		color: #686868;
		font-size: 10px;
		line-height: 1.45;
		-webkit-box-orient: vertical;
		line-clamp: 2;
		-webkit-line-clamp: 2;
	}
	.tag-row {
		display: flex;
		gap: 5px;
		margin-top: 10px;
	}
	.tag-row span {
		padding: 3px 6px;
		border-radius: 3px;
		background: #f0f0f0;
		color: #666;
		font-size: 8px;
	}
	.project-link {
		position: absolute;
		right: 23px;
		bottom: 18px;
		display: flex;
		align-items: center;
		gap: 5px;
		color: #177bc0;
		font-size: 10px;
		font-weight: 600;
		text-decoration: none;
	}
</style>
