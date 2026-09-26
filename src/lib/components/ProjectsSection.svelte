<script lang="ts">
	import { reveal } from '$lib/actions/reveal';
	import { projects } from '$lib/data/portfolio';
	import ProjectCard from './ProjectCard.svelte';
</script>

<section class="py-24 pr-6 pl-8 lg:px-12 lg:py-32" id="projects" aria-labelledby="projects-title">
	<div class="mx-auto w-full max-w-6xl">
		<header
			use:reveal
			class="mb-16 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-4 max-[420px]:gap-3"
		>
			<h2
				id="projects-title"
				class="max-w-2xl font-serif text-4xl leading-[1.1] font-normal tracking-tight lg:text-5xl"
			>
				Projects &amp; Technical Experience
			</h2>
			<span
				class="text-xs leading-normal tracking-[0.2em] text-stone uppercase max-[420px]:text-[10px]"
				>{projects.length} Entries</span
			>
		</header>
		<div class="grid gap-20">
			{#each projects as project (project.title)}
				<ProjectCard {project} />
			{/each}
		</div>
	</div>
</section>
