<script lang="ts">
	import { reveal, revealClasses } from '$lib/attachments/reveal';
	import type { Project } from '$lib/content';
	import ProjectCategory from './ProjectCategory.svelte';
	import ProjectDetails from './ProjectDetails.svelte';

	let { project, image }: { project: Project; image: NonNullable<Project['image']> } = $props();
</script>

<article
	class={[
		'group grid grid-cols-1 items-start gap-6 transition-[translate,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_10px_15px_-3px_rgb(0_0_0/8%)] lg:grid-cols-12 lg:gap-8',
		revealClasses
	]}
	{@attach reveal}
>
	<!-- eslint-disable svelte/no-navigation-without-resolve -- Project URLs are external destinations. -->
	<a
		class={[
			'flex aspect-video min-w-0 items-center justify-center overflow-hidden shadow-[0_0_0_1px_rgb(0_0_0/8%)] lg:col-span-7',
			project.kind === 'client' ? 'bg-cream-lighter' : 'bg-cream-light'
		]}
		href={project.url}
		aria-label={`Visit ${project.title}`}
	>
		<img
			class={[
				'size-full object-top transition-transform duration-400 group-hover:scale-[1.025]',
				image.fit === 'contain' ? 'bg-mist object-contain p-6' : 'object-cover'
			]}
			src={image.src}
			alt={image.alt}
			width="1440"
			height="960"
			loading="lazy"
		/>
	</a>
	<!-- eslint-enable svelte/no-navigation-without-resolve -->
	<div class="lg:col-span-5 lg:pt-4">
		<ProjectCategory {project} />
		<h3 class="mb-3 font-serif text-2xl/[1.2] lg:text-3xl/[1.2]">{project.title}</h3>
		<ProjectDetails {project} />
	</div>
</article>
