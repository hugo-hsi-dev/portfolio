<script lang="ts">
	import type { Project } from '$lib/content';
	import TextLink from './TextLink.svelte';

	let { project }: { project: Project } = $props();
</script>

<p class="mb-4 leading-relaxed text-slate">{project.description}</p>
<ul class="mb-4 flex flex-wrap gap-2">
	{#each project.technologies as technology (technology)}<li
			class="bg-cream-lighter px-2 py-1 text-xs/4 text-slate"
		>
			{technology}
		</li>{/each}
</ul>
{#if project.url}
	<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- Project URLs are external destinations. -->
	<TextLink href={project.url} label="Visit site"><span aria-hidden="true">↗</span></TextLink>
{/if}
