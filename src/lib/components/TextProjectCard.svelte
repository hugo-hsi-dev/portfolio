<script lang="ts">
	import { reveal, revealClasses } from '$lib/attachments/reveal';
	import type { Project } from '$lib/content';
	import ProjectCategory from './ProjectCategory.svelte';
	import ProjectDetails from './ProjectDetails.svelte';

	let { project }: { project: Project } = $props();
</script>

<article
	class={[
		'grid grid-cols-1 items-start gap-6 border-t border-cream-lighter pt-8 lg:grid-cols-12 lg:gap-8',
		revealClasses
	]}
	{@attach reveal}
>
	<div class="lg:col-span-5">
		<ProjectCategory {project} />
		<h3 class="font-serif text-3xl/[1.2]">{project.title}</h3>
	</div>
	<div class="lg:col-span-7">
		<ProjectDetails {project} />
	</div>
</article>
