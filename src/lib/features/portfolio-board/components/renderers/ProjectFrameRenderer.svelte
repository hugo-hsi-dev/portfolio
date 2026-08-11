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
		<div class="project-copy">
			<div class="project-meta">
				<span>{projectContextLabel(frame.project)}</span><span
					>{String(frame.projectIndex + 1).padStart(2, '0')}</span
				>
			</div>
			<h2>{frame.project.metadata.title}</h2>
			<p>{frame.project.metadata.excerpt}</p>
			<ul class="tag-row" aria-label="Technologies used">
				{#each frame.project.metadata.technologies as tech (tech)}<li>{tech}</li>{/each}
			</ul>
			{#if frame.project.metadata.liveUrl}<a
					class="project-link"
					href={frame.project.metadata.liveUrl}
					target="_blank"
					rel="noopener noreferrer">Visit project <ExternalLink size={14} /></a
				>{/if}
		</div>
	{:else}
		<div class="text-project">
			<div class="project-meta">
				<span>{projectContextLabel(frame.project)}</span><span
					>{String(frame.projectIndex + 1).padStart(2, '0')}</span
				>
			</div>
			<h2>{frame.project.metadata.title}</h2>
			<div class="text-project-details">
				<div class="text-project-contribution">
					<p class="project-section-label">Contribution</p>
					<p>{frame.project.metadata.excerpt}</p>
				</div>
				<div class="text-project-footer">
					<div>
						<p class="project-section-label">Technologies</p>
						<ul class="tag-row" aria-label="Technologies used">
							{#each frame.project.metadata.technologies as tech (tech)}<li>{tech}</li>{/each}
						</ul>
					</div>
					{#if frame.project.metadata.liveUrl}<a
							class="project-link"
							href={frame.project.metadata.liveUrl}
							target="_blank"
							rel="noopener noreferrer">Visit project <ExternalLink size={14} /></a
						>{/if}
				</div>
			</div>
		</div>
	{/if}
</article>

<style>
	.project-frame {
		display: grid;
		height: 100%;
		grid-template-rows: 350px 1fr;
		background: #fafaf8;
		color: #20201e;
	}
	.project-image {
		overflow: hidden;
		border-bottom: 1px solid #deded9;
		background: #e9e9e5;
	}
	.project-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		pointer-events: none;
	}
	.text-project {
		display: flex;
		grid-row: 1 / -1;
		padding: 48px 52px 50px;
		flex-direction: column;
	}
	.text-project h2 {
		max-width: 610px;
		margin: 76px 0 0;
		font-family: var(--font-serif);
		font-size: 72px;
		font-weight: 400;
		letter-spacing: -0.035em;
		line-height: 0.94;
	}
	.text-project-details {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 180px;
		gap: 48px;
		margin-top: auto;
		padding-top: 28px;
		border-top: 1px solid #dcdcd7;
	}
	.text-project-contribution > p:last-child {
		max-width: 440px;
		margin: 13px 0 0;
		color: #4e4e49;
		font-size: 16px;
		line-height: 1.5;
	}
	.project-section-label {
		margin: 0;
		color: #767671;
		font-size: 10px;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	.text-project-footer {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}
	.text-project-footer .tag-row {
		margin-top: 13px;
		color: #4e4e49;
		font-size: 13px;
	}
	.text-project-footer .project-link {
		margin-top: auto;
	}
	.project-copy {
		padding: 22px 28px 24px;
	}
	.project-meta {
		display: flex;
		justify-content: space-between;
		color: #767676;
		font-size: 10px;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	.project-copy h2 {
		margin: 9px 0 6px;
		font-family: var(--font-serif);
		font-size: 34px;
		font-weight: 400;
		letter-spacing: -0.018em;
		line-height: 1.02;
	}
	.project-copy > p {
		max-width: 610px;
		margin: 0;
		color: #5f5f5a;
		font-size: 13px;
		line-height: 1.45;
	}
	.tag-row {
		display: flex;
		gap: 0;
		margin: 10px 0 0;
		padding: 0;
		color: #777772;
		font-size: 10px;
		font-weight: 500;
		list-style: none;
	}
	.tag-row li:not(:last-child)::after {
		margin: 0 7px;
		color: #adada7;
		content: '·';
	}
	.project-link {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		margin-top: 12px;
		color: #20201e;
		font-size: 12px;
		font-weight: 600;
		text-decoration-line: underline;
		text-decoration-color: #9a9a95;
		text-decoration-thickness: 1px;
		text-underline-offset: 3px;
	}
	.project-link:focus-visible {
		outline: 2px solid #2868d8;
		outline-offset: 3px;
	}
</style>
