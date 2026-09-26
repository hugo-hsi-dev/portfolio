<script lang="ts">
	import { links } from '$lib/content';
	import MagneticLink from './MagneticLink.svelte';
	import GitHubIcon from './icons/GitHubIcon.svelte';
	import LinkedInIcon from './icons/LinkedInIcon.svelte';

	let { showName }: { showName: boolean } = $props();

	const socialClass =
		'pointer-events-auto -m-2.5 inline-flex min-h-11 min-w-11 items-center justify-center opacity-80 transition-opacity duration-200 hover:opacity-100';
</script>

<header
	class="pointer-events-none fixed inset-x-0 top-0 z-50 flex items-center justify-between py-6 pr-6 pl-8 text-white mix-blend-difference lg:px-12"
>
	<MagneticLink
		intensity={0.2}
		href="#top"
		aria-label="Hugo Hsi, back to top"
		class={[
			'pointer-events-auto font-serif text-xl/normal tracking-tight transition-[opacity,translate] duration-500 ease-out focus-visible:translate-y-0 focus-visible:opacity-100',
			showName ? 'translate-y-0 opacity-100' : '-translate-y-[5px] opacity-0'
		]}>Hugo Hsi</MagneticLink
	>
	<nav class="flex items-center gap-6" aria-label="Social links">
		<MagneticLink href={links.github} aria-label="GitHub" class={socialClass}
			><GitHubIcon /></MagneticLink
		>
		<MagneticLink href={links.linkedin} aria-label="LinkedIn" class={socialClass}
			><LinkedInIcon /></MagneticLink
		>
	</nav>
</header>
