<script lang="ts">
	import MagneticLink from './MagneticLink.svelte';
	import { github, linkedin } from '$lib/data/contact';
	let { showName = false }: { showName?: boolean } = $props();
	const socialLinkClass =
		'pointer-events-auto -m-2.5 inline-flex min-h-11 min-w-11 items-center justify-center opacity-80 transition-opacity duration-200 hover:opacity-100 motion-reduce:transition-none';
</script>

<header
	class="pointer-events-none fixed inset-x-0 top-0 z-50 flex items-center justify-between py-6 pr-6 pl-8 text-white mix-blend-difference lg:px-12"
>
	<MagneticLink
		class={[
			'pointer-events-auto font-serif text-xl tracking-[-0.025em] transition-[opacity,translate] duration-500 ease-out focus-visible:translate-y-0 focus-visible:opacity-100 motion-reduce:transition-none',
			showName ? 'translate-y-0 opacity-100' : '-translate-y-[5px] opacity-0'
		]}
		intensity={0.2}
		href="#top"
		aria-label="Hugo Hsi, back to top">Hugo Hsi</MagneticLink
	>
	<nav class="flex items-center gap-6" aria-label="Social links">
		<MagneticLink class={socialLinkClass} href={github.url} aria-label={github.label}
			><svg
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				aria-hidden="true"
				><path
					d="M9 19c-4.3 1.3-4.3-2.2-6-2.7m12 5v-3.4c0-1 .1-1.5-.5-2.1 3.1-.3 6.4-1.5 6.4-6.9 0-1.5-.5-2.7-1.4-3.7.2-.4.6-1.8-.1-3.6 0 0-1.2-.4-3.8 1.4a13 13 0 0 0-6.9 0C6.1 1.2 4.9 1.6 4.9 1.6c-.7 1.8-.3 3.2-.1 3.6a5.3 5.3 0 0 0-1.4 3.7c0 5.4 3.3 6.6 6.4 6.9-.5.5-.8 1.1-.8 2.1v3.4"
				/></svg
			></MagneticLink
		>
		<MagneticLink class={socialLinkClass} href={linkedin.url} aria-label={linkedin.label}
			><svg
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				aria-hidden="true"
				><rect x="3" y="3" width="18" height="18" rx="1" /><path
					d="M7 10v7m0-10v.1M11 17v-7m0 3a3 3 0 0 1 6 0v4"
				/></svg
			></MagneticLink
		>
	</nav>
</header>
