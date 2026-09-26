<script lang="ts">
	import type { Project } from '$lib/content';
	import ImageProjectCard from './ImageProjectCard.svelte';
	import TextProjectCard from './TextProjectCard.svelte';

	let { projects }: { projects: Project[] } = $props();
</script>

<div class="grid gap-20">
	{#each projects as project (project.title)}
		{#if project.image}
			<ImageProjectCard {project} image={project.image} />
		{:else}
			<TextProjectCard {project} />
		{/if}
	{/each}
</div>
