<script lang="ts">
	import { projects } from '$lib/data/portfolio';
	import ProjectCard from './ProjectCard.svelte';
	import Section from './Section.svelte';
</script>

<Section id="projects" title="Projects &amp; Technical Experience">
	<div class="grid gap-20">
		{#each projects as project (project.title)}
			<ProjectCard {project} />
		{/each}
	</div>
</Section>
