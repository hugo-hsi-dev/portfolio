<script lang="ts">
	import type { CanvasFrame } from '$lib/features/portfolio-content';

	import ContactFrameRenderer from './renderers/ContactFrameRenderer.svelte';
	import EducationFrameRenderer from './renderers/EducationFrameRenderer.svelte';
	import ExperienceFrameRenderer from './renderers/ExperienceFrameRenderer.svelte';
	import ProfileFrameRenderer from './renderers/ProfileFrameRenderer.svelte';
	import ProjectFrameRenderer from './renderers/ProjectFrameRenderer.svelte';
	import TechnologiesFrameRenderer from './renderers/TechnologiesFrameRenderer.svelte';

	let { frame, onOpenProjects }: { frame: CanvasFrame; onOpenProjects: () => void } = $props();
</script>

{#if frame.kind === 'profile'}
	<ProfileFrameRenderer {frame} {onOpenProjects} />
{:else if frame.kind === 'contact'}
	<ContactFrameRenderer {frame} />
{:else if frame.kind === 'project'}
	<ProjectFrameRenderer {frame} />
{:else if frame.kind === 'experience'}
	<ExperienceFrameRenderer {frame} />
{:else if frame.kind === 'education'}
	<EducationFrameRenderer {frame} />
{:else}
	<TechnologiesFrameRenderer {frame} />
{/if}
