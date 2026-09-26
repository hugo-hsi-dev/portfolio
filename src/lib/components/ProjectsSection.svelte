<script lang="ts">
	import { projects } from '$lib/data/portfolio';
	import ProjectCard from './ProjectCard.svelte';
	import Section from './Section.svelte';
</script>

<Section id="projects" title="Projects &amp; Technical Experience">
	{#snippet headerAside()}
		<span
			class="text-xs leading-normal tracking-[0.2em] text-stone uppercase max-[420px]:text-[10px]"
			>{projects.length} Entries</span
		>
	{/snippet}
	<div class="grid gap-20">
		{#each projects as project (project.title)}
			<ProjectCard {project} />
		{/each}
	</div>
</Section>
