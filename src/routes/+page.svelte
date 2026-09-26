<script lang="ts">
	import { education, experience, projects, skills } from '$lib/content';
	import Hero from '$lib/components/Hero.svelte';
	import ProjectList from '$lib/components/ProjectList.svelte';
	import ScrollProgress from '$lib/components/ScrollProgress.svelte';
	import Section from '$lib/components/Section.svelte';
	import SiteFooter from '$lib/components/SiteFooter.svelte';
	import SiteNav from '$lib/components/SiteNav.svelte';
	import SkillGrid from '$lib/components/SkillGrid.svelte';
	import Timeline from '$lib/components/Timeline.svelte';

	let heroNameVisible = $state(true);
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
</svelte:head>

<a
	class="fixed top-3 left-3 z-100 -translate-y-[180%] bg-charcoal px-4.5 py-3 text-cream focus:translate-y-0"
	href="#main">Skip to content</a
>
<ScrollProgress />
<SiteNav showName={!heroNameVisible} />

<main id="main" class="overflow-clip">
	<Hero onnamevisibilitychange={(visible) => (heroNameVisible = visible)} />

	<Section
		id="projects"
		titleId="projects-title"
		title="Projects & Technical Experience"
		meta="{projects.length} Entries"
	>
		<ProjectList {projects} />
	</Section>

	<Section id="experience" titleId="experience-title" title="Experience" tone="dark">
		<Timeline entries={experience} />
	</Section>

	<Section titleId="education-title" title="Education" tone="dark" class="border-t border-border">
		<Timeline entries={education} />
	</Section>

	<Section titleId="tech-title" title="Technical Skills">
		<SkillGrid groups={skills} />
	</Section>
</main>

<SiteFooter />
