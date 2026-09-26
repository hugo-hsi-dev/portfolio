<script lang="ts">
	import type { Project } from '$lib/content';

	let { project }: { project: Project } = $props();
</script>

<span
	class={[
		'mb-3 block text-xs/normal tracking-label uppercase',
		project.kind === 'client' ? 'text-gold-on-cream' : 'text-sage-on-cream'
	]}>{project.category}</span
>
