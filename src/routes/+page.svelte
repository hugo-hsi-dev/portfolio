<script lang="ts">
	import { asset } from '$app/paths';
	import Hero from '$lib/components/Hero.svelte';
	import SiteNav from '$lib/components/SiteNav.svelte';
	import ScrollProgress from '$lib/components/ScrollProgress.svelte';
	import ProjectsSection from '$lib/components/ProjectsSection.svelte';
	import TimelineSection from '$lib/components/TimelineSection.svelte';
	import SkillsSection from '$lib/components/SkillsSection.svelte';
	import SiteFooter from '$lib/components/SiteFooter.svelte';
	import { experience, education } from '$lib/data/portfolio';

	let showName = $state(false);
</script>

<svelte:head>
	<title>Hugo Hsi — Full-stack Developer</title>
	<meta
		name="description"
		content="Hugo Hsi is a Brooklyn-based full-stack developer with a background in communication design, building responsive websites, migrating content systems, and maintaining production applications."
	/>
	<meta property="og:title" content="Hugo Hsi — Full-stack Developer" />
	<meta
		property="og:description"
		content="Engineering products from design to database. Selected work, experience, and education."
	/>
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://hugohsi.dev/" />
	<meta name="theme-color" content="#f8f6f1" />
	<link rel="canonical" href="https://hugohsi.dev/" />
	<link
		rel="preload"
		href={asset('/fonts/forum.ttf')}
		as="font"
		type="font/ttf"
		crossorigin="anonymous"
	/>
	<link
		rel="preload"
		href={asset('/fonts/outfit.ttf')}
		as="font"
		type="font/ttf"
		crossorigin="anonymous"
	/>
</svelte:head>

<a
	class="fixed top-3 left-3 z-100 -translate-y-[180%] bg-charcoal px-[18px] py-3 text-cream focus:translate-y-0"
	href="#main">Skip to content</a
>
<ScrollProgress />
<SiteNav {showName} />
<main id="main" tabindex="-1" class="overflow-clip">
	<Hero onNameVisibilityChange={(visible) => (showName = !visible)} />
	<ProjectsSection />
	<TimelineSection id="experience" title="Experience" items={experience} />
	<TimelineSection id="education" title="Education" items={education} divided />
	<SkillsSection />
</main>
<SiteFooter />
