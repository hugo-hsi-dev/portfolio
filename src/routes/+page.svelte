<script lang="ts">
	import { resolve } from '$app/paths';
	import { ExternalLink, Mail } from '@lucide/svelte';
	import type { Attachment } from 'svelte/attachments';
	import BrandIcon from '$lib/components/BrandIcon.svelte';
	import InkLink from '$lib/components/InkLink.svelte';
	import ProjectCard from '$lib/components/ProjectCard.svelte';
	import Reveal from '$lib/components/Reveal.svelte';
	import ScrollProgress from '$lib/components/ScrollProgress.svelte';
	import SectionHeader from '$lib/components/SectionHeader.svelte';
	import SocialLink from '$lib/components/SocialLink.svelte';
	import Timeline from '$lib/components/Timeline.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let showName = $state(false);

	const technologyCategories = [
		{ key: 'frontend', label: 'Frontend' },
		{ key: 'backend', label: 'Backend' },
		{ key: 'database', label: 'Database' },
		{ key: 'tools', label: 'Tools' }
	] as const;
	const currentYear = new Date().getFullYear();
	const initialCharacterDelayMs = 200;
	const characterDelayMs = 40;

	let typedCharacterCount = $state(0);
	let taglineCharacters = $derived(Array.from(data.site.metadata.hero.tagline));
	let typewriterEndDelay = $derived(
		`${initialCharacterDelayMs + data.site.metadata.hero.tagline.length * characterDelayMs}ms`
	);

	const typewriter: Attachment<HTMLElement> = () => {
		const tagline = data.site.metadata.hero.tagline;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			typedCharacterCount = tagline.length;
			return;
		}

		typedCharacterCount = 0;
		let intervalId: number | undefined;
		const startId = window.setTimeout(() => {
			typedCharacterCount = 1;
			intervalId = window.setInterval(() => {
				typedCharacterCount = Math.min(typedCharacterCount + 1, tagline.length);
				if (typedCharacterCount === tagline.length && intervalId) {
					window.clearInterval(intervalId);
					intervalId = undefined;
				}
			}, characterDelayMs);
		}, initialCharacterDelayMs);

		return () => {
			window.clearTimeout(startId);
			if (intervalId) window.clearInterval(intervalId);
		};
	};

	let experienceItems = $derived(
		data.experience.map((item) => ({
			slug: item.slug,
			title: item.metadata.role,
			subtitle: item.metadata.company,
			startDate: item.metadata.startDate,
			endDate: item.metadata.endDate,
			isCurrent: item.metadata.isCurrent,
			html: item.html || undefined
		}))
	);

	let educationItems = $derived(
		data.education.map((item) => ({
			slug: item.slug,
			title: item.metadata.degree,
			subtitle: item.metadata.institution,
			startDate: item.metadata.startDate,
			endDate: item.metadata.endDate,
			html: item.html || undefined
		}))
	);

	let hasTechnologies = $derived(
		technologyCategories.some((category) => data.technologies.metadata[category.key].length > 0)
	);
	let socialImageUrl = $derived(
		new URL(data.site.metadata.seo.image, data.site.metadata.seo.canonicalUrl).href
	);
	let structuredDataJson = $derived.by(() => {
		const site = data.site.metadata;
		const sameAs = [site.contact.github, site.contact.linkedin].filter((value): value is string =>
			Boolean(value)
		);
		const knowsAbout = Array.from(
			new Set(technologyCategories.flatMap((category) => data.technologies.metadata[category.key]))
		);

		return JSON.stringify({
			'@context': 'https://schema.org',
			'@graph': [
				{
					'@type': 'Person',
					name: `${site.hero.firstName} ${site.hero.lastName}`,
					jobTitle: site.seo.jobTitle,
					email: site.contact.email,
					url: site.seo.canonicalUrl,
					sameAs,
					knowsAbout
				},
				{
					'@type': 'WebSite',
					name: `${site.hero.firstName} ${site.hero.lastName} Portfolio`,
					url: site.seo.canonicalUrl,
					description: site.seo.description
				},
				{
					'@type': 'WebPage',
					name: site.seo.title,
					url: site.seo.canonicalUrl,
					description: site.seo.description,
					author: {
						'@type': 'Person',
						name: `${site.hero.firstName} ${site.hero.lastName}`
					}
				},
				{
					'@type': 'ItemList',
					name: 'Selected Projects',
					itemListElement: data.projects.map((project, index) => ({
						'@type': 'ListItem',
						position: index + 1,
						item: {
							'@type': 'CreativeWork',
							name: project.metadata.title,
							description: project.metadata.excerpt,
							url: project.metadata.liveUrl,
							keywords: project.metadata.technologies
						}
					}))
				}
			]
		}).replaceAll('<', '\\u003c');
	});

	const watchEyebrow: Attachment<HTMLElement> = (element) => {
		const observer = new IntersectionObserver(([entry]) => {
			showName = !entry?.isIntersecting;
		});

		observer.observe(element);
		return () => observer.disconnect();
	};
</script>

<svelte:head>
	<title>{data.site.metadata.seo.title}</title>
	<meta name="description" content={data.site.metadata.seo.description} />
	<meta
		name="author"
		content={`${data.site.metadata.hero.firstName} ${data.site.metadata.hero.lastName}`}
	/>
	<meta name="keywords" content={data.site.metadata.seo.keywords.join(', ')} />
	<meta name="robots" content="index, follow, max-image-preview:large" />
	<meta name="theme-color" content={data.site.metadata.seo.themeColor} />
	<link rel="canonical" href={data.site.metadata.seo.canonicalUrl} />

	<meta property="og:type" content="website" />
	<meta property="og:locale" content="en_US" />
	<meta property="og:site_name" content="Hugo Hsi Portfolio" />
	<meta property="og:title" content={data.site.metadata.seo.title} />
	<meta property="og:description" content={data.site.metadata.seo.description} />
	<meta property="og:url" content={data.site.metadata.seo.canonicalUrl} />
	<meta property="og:image" content={socialImageUrl} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content={data.site.metadata.seo.imageAlt} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={data.site.metadata.seo.title} />
	<meta name="twitter:description" content={data.site.metadata.seo.description} />
	<meta name="twitter:image" content={socialImageUrl} />
	<meta name="twitter:image:alt" content={data.site.metadata.seo.imageAlt} />

	<!-- prettier-ignore -->
	<script type="application/ld+json">
{@html structuredDataJson}
	</script>
</svelte:head>

<a class="skip-link" href="#main">Skip to content</a>
<ScrollProgress />

<nav class="site-nav" aria-label="Main navigation">
	<div class="nav-inner">
		<a
			href={resolve('/')}
			class={['brand', showName && 'brand--visible']}
			aria-hidden={!showName}
			tabindex={showName ? undefined : -1}
			aria-label="Back to top"
		>
			{data.site.metadata.hero.firstName}
			{data.site.metadata.hero.lastName}
		</a>

		<div class="nav-links">
			{#if data.site.metadata.contact.github}
				<SocialLink href={data.site.metadata.contact.github} label="GitHub profile">
					<BrandIcon name="github" />
				</SocialLink>
			{/if}
			{#if data.site.metadata.contact.linkedin}
				<SocialLink href={data.site.metadata.contact.linkedin} label="LinkedIn profile">
					<BrandIcon name="linkedin" />
				</SocialLink>
			{/if}
		</div>
	</div>
</nav>

<main id="main" tabindex="-1">
	<section
		class="hero"
		aria-labelledby="hero-title"
		style:--typewriter-end-delay={typewriterEndDelay}
	>
		<div class="hero-inner">
			<div class="hero-main">
				<p id="hero-eyebrow" class="eyebrow" {@attach watchEyebrow}>
					{data.site.metadata.hero.firstName}
					{data.site.metadata.hero.lastName}
				</p>

				<h1 id="hero-title" aria-label={data.site.metadata.hero.tagline}>
					<span
						class="typewriter-text"
						class:typing-not-started={typedCharacterCount === 0}
						aria-hidden="true"
						{@attach typewriter}
					>
						{#each taglineCharacters as character, index (`${index}-${character}`)}
							<span
								class:untyped-character={index >= typedCharacterCount}
								class:cursor-anchor={index === typedCharacterCount - 1}>{character}</span
							>
						{/each}
					</span>
				</h1>

				{#if data.site.metadata.hero.intro}
					<p class="hero-intro">{data.site.metadata.hero.intro}</p>
				{/if}

				<div class="hero-actions">
					<InkLink
						href={data.site.metadata.hero.ctaPrimary.link}
						ariaLabel={data.site.metadata.hero.ctaPrimary.text}
					>
						{data.site.metadata.hero.ctaPrimary.text}
					</InkLink>

					{#if data.site.metadata.resumeUrl && data.site.metadata.hero.ctaSecondary}
						<InkLink
							href={data.site.metadata.resumeUrl}
							variant="outline"
							ariaLabel={data.site.metadata.hero.ctaSecondary.text}
							download="resume_hugo-hsi.pdf"
						>
							{data.site.metadata.hero.ctaSecondary.text}
						</InkLink>
					{/if}
				</div>
			</div>

			{#if data.site.metadata.hero.quote}
				<aside class="hero-quote">
					<span aria-hidden="true">“</span>{data.site.metadata.hero.quote}<span aria-hidden="true"
						>”</span
					>
				</aside>
			{/if}
		</div>
	</section>

	{#if data.projects.length}
		<section class="projects-section" id="projects" aria-labelledby="projects-title">
			<div class="section-container">
				<SectionHeader
					title="Selected Work"
					id="projects-title"
					meta={`${data.projects.length} ${data.projects.length === 1 ? 'project' : 'projects'}`}
				/>

				<div class="project-list">
					{#each data.projects as project, index (project.slug)}
						<Reveal delay={Math.min(index * 80, 160)}>
							<ProjectCard {project} priority={index === 0} />
						</Reveal>
					{/each}
				</div>
			</div>
		</section>
	{/if}

	{#if experienceItems.length}
		<Timeline title="Experience" items={experienceItems} />
	{/if}

	{#if educationItems.length}
		<Timeline title="Education" items={educationItems} topBorder={experienceItems.length > 0} />
	{/if}

	{#if hasTechnologies}
		<section class="stack-section" aria-labelledby="stack-title">
			<div class="section-container">
				<Reveal>
					<SectionHeader title="Tech Stack" id="stack-title" />
				</Reveal>

				<Reveal delay={80}>
					<div class="stack-grid">
						{#each technologyCategories as category (category.key)}
							{#if data.technologies.metadata[category.key].length}
								<div class="stack-category">
									<h3>{category.label}</h3>
									<ul>
										{#each data.technologies.metadata[category.key] as technology (technology)}
											<li>{technology}</li>
										{/each}
									</ul>
								</div>
							{/if}
						{/each}
					</div>
				</Reveal>
			</div>
		</section>
	{/if}

	{#if data.lab.length}
		<section class="lab-section" aria-labelledby="lab-title">
			<div class="section-container">
				<Reveal>
					<SectionHeader title="Lab" id="lab-title" meta="Experiments and learning" />
				</Reveal>

				<div class="lab-grid">
					{#each data.lab as item, index (item.slug)}
						<Reveal delay={Math.min(index * 80, 240)}>
							{#if item.metadata.githubUrl}
								<a
									class="lab-card"
									href={item.metadata.githubUrl}
									target="_blank"
									rel="noopener noreferrer"
								>
									<h3>{item.metadata.name}</h3>
									<p>{item.metadata.description}</p>
									<span>{item.metadata.technologies}</span>
									<ExternalLink size={15} aria-hidden="true" />
								</a>
							{:else}
								<article class="lab-card">
									<h3>{item.metadata.name}</h3>
									<p>{item.metadata.description}</p>
									<span>{item.metadata.technologies}</span>
								</article>
							{/if}
						</Reveal>
					{/each}
				</div>
			</div>
		</section>
	{/if}
</main>

<footer class="site-footer" id="contact">
	<div class="section-container">
		<Reveal>
			<div class="footer-main">
				<div>
					<h2>{data.site.metadata.footer.heading}</h2>
					<p>{data.site.metadata.footer.intro}</p>
				</div>

				<div class="footer-contact">
					<a class="email-link" href={`mailto:${data.site.metadata.contact.email}`}>
						<Mail size={23} strokeWidth={1.75} aria-hidden="true" />
						{data.site.metadata.contact.email}
					</a>
					<div class="footer-socials">
						{#if data.site.metadata.contact.github}
							<a href={data.site.metadata.contact.github} target="_blank" rel="noopener noreferrer"
								>GitHub</a
							>
						{/if}
						{#if data.site.metadata.contact.linkedin}
							<a
								href={data.site.metadata.contact.linkedin}
								target="_blank"
								rel="noopener noreferrer">LinkedIn</a
							>
						{/if}
					</div>
				</div>
			</div>
		</Reveal>

		<div class="footer-bottom">
			<p>&copy; {currentYear} Hugo Hsi. All rights reserved.</p>
			<p>{data.site.metadata.footer.builtWith}</p>
		</div>
	</div>
</footer>

<style>
	.site-nav {
		position: fixed;
		z-index: 50;
		top: 0;
		right: 0;
		left: 0;
		color: white;
		mix-blend-mode: difference;
		pointer-events: none;
	}

	.nav-inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem var(--page-gutter);
	}

	.brand,
	.nav-links {
		pointer-events: auto;
	}

	.brand {
		color: white;
		font-family: var(--font-serif);
		font-size: 1.25rem;
		opacity: 0;
		transform: translateY(-0.3rem);
		transition:
			opacity 240ms var(--ease-out),
			transform 240ms var(--ease-out);
		pointer-events: none;
	}

	.brand--visible {
		opacity: 1;
		transform: translateY(0);
		pointer-events: auto;
	}

	.nav-links {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	main {
		background: var(--color-cream);
		overflow: clip;
	}

	.hero {
		position: relative;
		display: flex;
		align-items: center;
		min-height: calc(100svh - 7rem);
		padding: 6.5rem var(--page-gutter) 4rem;
		isolation: isolate;
	}

	.hero::before {
		position: absolute;
		z-index: -1;
		inset: 0;
		background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
		content: '';
		opacity: 0.018;
		pointer-events: none;
	}

	.hero-inner {
		position: relative;
		display: grid;
		width: min(100%, var(--content-width));
		margin-inline: auto;
		gap: 3rem;
		align-items: end;
	}

	.eyebrow {
		margin: 0 0 1.5rem;
		color: var(--color-slate);
		font-size: 0.8125rem;
		font-weight: 500;
		text-transform: uppercase;
	}

	h1 {
		max-width: 48rem;
		margin: 0 0 2rem;
		font-family: var(--font-serif);
		font-size: 3rem;
		font-weight: 400;
		line-height: 1.08;
		text-wrap: balance;
	}

	.untyped-character {
		visibility: hidden;
	}

	.typewriter-text.typing-not-started::before,
	.cursor-anchor::after {
		display: inline-block;
		width: 0;
		height: 0.86em;
		border-inline-start: 2px solid currentColor;
		content: '';
		vertical-align: -0.05em;
	}

	.hero-intro {
		max-width: 35rem;
		margin: 0 0 2.25rem;
		color: var(--color-slate);
		font-size: 1.0625rem;
		line-height: 1.75;
		text-wrap: pretty;
	}

	.hero-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.875rem;
	}

	.hero-quote {
		max-width: 25rem;
		color: var(--color-slate);
		font-family: var(--font-serif);
		font-size: 1rem;
		font-style: italic;
		line-height: 1.65;
	}

	.hero-quote span {
		color: var(--color-gold);
	}

	.projects-section,
	.stack-section,
	.lab-section {
		padding: var(--section-space) var(--page-gutter);
	}

	.projects-section {
		padding-block-start: 1.5rem;
	}

	.projects-section,
	.stack-section {
		background: var(--color-cream);
	}

	.project-list {
		display: grid;
		gap: 5rem;
	}

	.stack-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 2.5rem 2rem;
	}

	.stack-category h3 {
		margin: 0 0 1rem;
		color: var(--color-slate);
		font-family: var(--font-sans);
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	.stack-category ul {
		display: grid;
		gap: 0.625rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.stack-category li {
		line-height: 1.45;
	}

	.lab-section {
		background: var(--color-cream-light);
	}

	.lab-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1.5rem;
	}

	.lab-card {
		position: relative;
		display: block;
		min-height: 12rem;
		background: var(--color-cream);
		padding: 1.5rem;
		transition: background-color 180ms ease;
	}

	.lab-card h3 {
		margin: 0 0 0.75rem;
		font-family: var(--font-serif);
		font-size: 1.375rem;
		font-weight: 400;
	}

	.lab-card p {
		margin: 0 0 1rem;
		color: var(--color-slate);
		font-size: 0.875rem;
		line-height: 1.6;
	}

	.lab-card span {
		color: var(--color-slate);
		font-size: 0.75rem;
	}

	.lab-card :global(svg) {
		position: absolute;
		right: 1.5rem;
		bottom: 1.5rem;
	}

	.site-footer {
		background: var(--color-charcoal);
		color: var(--color-cream);
		padding: 6rem var(--page-gutter) 3rem;
	}

	.footer-main {
		display: grid;
		gap: 3.5rem;
		margin-block-end: 5rem;
	}

	.site-footer h2 {
		margin: 0 0 1.5rem;
		font-family: var(--font-serif);
		font-size: 3rem;
		font-weight: 400;
		line-height: 1;
	}

	.site-footer p {
		max-width: 32rem;
		margin: 0;
		color: var(--color-stone-light);
		font-size: 1.0625rem;
		line-height: 1.7;
	}

	.footer-contact {
		display: flex;
		align-items: flex-start;
		flex-direction: column;
		justify-content: end;
		gap: 1.25rem;
	}

	.email-link {
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		max-width: 100%;
		color: var(--color-cream);
		font-size: 1.375rem;
		overflow-wrap: anywhere;
		transition: color 180ms ease;
	}

	.footer-socials {
		display: flex;
		gap: 1.5rem;
	}

	.footer-socials a {
		position: relative;
		color: var(--color-stone);
		font-size: 0.875rem;
		transition: color 180ms ease;
	}

	.footer-socials a::after {
		position: absolute;
		right: 0;
		bottom: -2px;
		left: 0;
		height: 1px;
		background: currentColor;
		content: '';
		transform: scaleX(0);
		transform-origin: left;
	}

	.footer-bottom {
		display: flex;
		align-items: flex-start;
		flex-direction: column;
		justify-content: space-between;
		gap: 0.75rem;
		border-top: 1px solid var(--color-border);
		padding-block-start: 2rem;
	}

	.footer-bottom p {
		color: var(--color-stone);
		font-size: 0.75rem;
		line-height: 1.5;
	}

	@keyframes hero-follow {
		from {
			opacity: 0;
			transform: translateY(0.65rem);
		}

		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes cursor-blink {
		0%,
		49% {
			opacity: 1;
		}

		50%,
		100% {
			opacity: 0;
		}
	}

	@keyframes hero-quote-in {
		from {
			opacity: 0;
			transform: translateX(1rem);
		}

		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	@media (prefers-reduced-motion: no-preference) {
		.eyebrow {
			animation: hero-follow 600ms var(--ease-out) both;
		}

		.typewriter-text.typing-not-started::before,
		.cursor-anchor::after {
			animation: cursor-blink 900ms steps(1, end) infinite;
		}

		.hero-intro {
			animation: hero-follow 680ms var(--ease-out) calc(var(--typewriter-end-delay) + 700ms) both;
		}

		.hero-quote {
			animation: hero-quote-in 820ms var(--ease-out) calc(var(--typewriter-end-delay) + 900ms) both;
		}
	}

	@media (hover: hover) and (pointer: fine) {
		.lab-card {
			transition:
				background-color 180ms ease,
				transform 180ms var(--ease-out);
		}

		a.lab-card:hover {
			background: white;
			transform: translateY(-0.2rem);
		}

		.email-link:hover {
			color: var(--color-gold);
		}

		.footer-socials a::after {
			transition: transform 180ms var(--ease-out);
		}

		.footer-socials a:hover {
			color: var(--color-cream);
		}

		.footer-socials a:hover::after {
			transform: scaleX(1);
		}
	}

	@media (min-width: 48rem) {
		.projects-section {
			padding-block-start: 3.5rem;
		}

		h1 {
			font-size: 3.75rem;
		}

		.stack-grid {
			grid-template-columns: repeat(4, minmax(0, 1fr));
		}

		.lab-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.footer-bottom {
			align-items: center;
			flex-direction: row;
		}
	}

	@media (min-width: 64rem) {
		.nav-inner {
			padding-block: 1.25rem;
		}

		.hero {
			padding-block: 7rem 5rem;
		}

		.hero-inner {
			grid-template-columns: minmax(0, 8fr) minmax(16rem, 4fr);
			gap: 2rem;
		}

		h1 {
			font-size: 4.5rem;
		}

		.hero-quote {
			justify-self: end;
			text-align: right;
		}

		.lab-grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}

		.site-footer {
			padding-block: 8rem 3rem;
		}

		.footer-main {
			grid-template-columns: minmax(0, 1fr) minmax(20rem, 1fr);
			gap: 4rem;
		}

		.site-footer h2 {
			font-size: 4.5rem;
		}

		.footer-contact {
			align-items: flex-end;
			text-align: right;
		}

		.email-link {
			font-size: 1.75rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.brand,
		.footer-socials a::after {
			transition: none;
		}

		.lab-card {
			transition: background-color 180ms ease;
		}

		.footer-socials a::after {
			display: none;
		}
	}

	@media (prefers-reduced-motion: reduce) and (hover: hover) and (pointer: fine) {
		a.lab-card:hover {
			transform: none;
		}
	}
</style>
