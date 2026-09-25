<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { asset } from '$app/paths';
	import { magnetic } from '$lib/actions/magnetic';

	const headline = 'Engineering products from design to database.';
	let typedHeadline = $state(headline);
	let typing = $state(false);
	let showCursor = $state(false);
	let progress = $state(0);
	let showName = $state(false);
	let heroName: HTMLParagraphElement;

	onMount(() => {
		const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
		let typingTimer: ReturnType<typeof setTimeout>;
		const animations = new SvelteSet<Animation>();
		const animate = (element: Element, delay = 0, x = 0, y = 40, duration = 600) => {
			if (preference.matches || !element.animate) return;
			const animation = element.animate(
				[
					{ opacity: 0, transform: `translate(${x}px, ${y}px)` },
					{ opacity: 1, transform: 'translateY(0)' }
				],
				{ duration, delay, easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', fill: 'backwards' }
			);
			animations.add(animation);
			animation.onfinish = () => animations.delete(animation);
		};
		const completeHeadline = () => {
			clearTimeout(typingTimer);
			typedHeadline = headline;
			typing = false;
			showCursor = false;
		};
		const revealObserver = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (!entry.isIntersecting) continue;
					animate(entry.target);
					revealObserver.unobserve(entry.target);
				}
			},
			{ threshold: 0.1 }
		);
		document
			.querySelectorAll(
				'.section-heading, .project, .timeline-item, .tech-grid, .footer-grid, .footer-bottom'
			)
			.forEach((element) => revealObserver.observe(element));
		if (!preference.matches && window.scrollY < window.innerHeight) {
			typedHeadline = '';
			typing = true;
			showCursor = true;
			animate(heroName, 0, 0, 10, 400);
			let index = 0;
			const typeNext = () => {
				typedHeadline = headline.slice(0, ++index);
				if (index < headline.length) {
					typingTimer = setTimeout(typeNext, 35);
				} else {
					typing = false;
				}
			};
			typingTimer = setTimeout(typeNext, 300);
			const intro = document.querySelector('.intro');
			const quote = document.querySelector('.hero-quote');
			if (intro) animate(intro, 100, 0, 0, 500);
			document.querySelectorAll('.hero-actions > a').forEach((element, i) => {
				animate(element, 220 + i * 150, 0, 10, 350);
			});
			if (quote) animate(quote, 520, 20, 0, 450);
		}
		const updateProgress = () => {
			const distance = document.documentElement.scrollHeight - window.innerHeight;
			progress = distance > 0 ? window.scrollY / distance : 0;
		};
		const observer = new IntersectionObserver(([entry]) => {
			showName = !entry.isIntersecting;
		});
		const updatePreference = () => {
			if (preference.matches) {
				completeHeadline();
				animations.forEach((animation) => animation.cancel());
				animations.clear();
			}
		};
		observer.observe(heroName);
		preference.addEventListener('change', updatePreference);
		window.addEventListener('scroll', updateProgress, { passive: true });
		window.addEventListener('resize', updateProgress);
		updateProgress();
		return () => {
			clearTimeout(typingTimer);
			animations.forEach((animation) => animation.cancel());
			revealObserver.disconnect();
			observer.disconnect();
			preference.removeEventListener('change', updatePreference);
			window.removeEventListener('scroll', updateProgress);
			window.removeEventListener('resize', updateProgress);
		};
	});

	const projects = [
		{
			title: 'Windows & PC Hardware',
			category: 'Personal desktops and laptops',
			description:
				'Assembled a gaming desktop and installed Windows on personal desktops and laptops. Configured and updated BIOS, installed applications with winget and Scoop, and customized registry settings using technical guides.',
			technologies: ['Windows', 'PC assembly', 'BIOS', 'winget', 'Scoop'],
			url: '',
			image: '',
			alt: ''
		},
		{
			title: 'Arch Linux',
			category: 'Personal development laptop',
			description:
				'Explored Ubuntu, Fedora, and Zorin before choosing Arch for an aging laptop with battery and performance issues. Installed Arch using its documentation, managed packages with pacman, tested Hyprland and Niri, and maintained the system through updates and configuration cleanup.',
			technologies: ['Arch Linux', 'pacman', 'Hyprland', 'Niri'],
			url: '',
			image: '',
			alt: ''
		},
		{
			title: 'MineCentral',
			category: 'Personal project',
			description:
				'Built and maintained a Minecraft server hosting platform with Next.js and self-hosted server management tools. Connected Stripe subscriptions to server provisioning and a dashboard for billing and instance monitoring.',
			technologies: ['Next.js', 'Stripe', 'Coolify'],
			url: 'https://www.minecentral.net/',
			image: asset('/projects/minecentral.png'),
			alt: 'MineCentral Minecraft server hosting website'
		}
	];

	const clientWork = [
		{
			title: 'National Medal of Honor Museum',
			url: 'https://mohmuseum.org/',
			image: asset('/projects/museum.png'),
			alt: 'National Medal of Honor Museum website'
		},
		{
			title: '1st Avenue Advisors',
			url: 'https://www.1staveadvisors.com/',
			image: asset('/projects/advisors.png'),
			alt: '1st Avenue Advisors official Open Graph logo'
		}
	];

	const experience = [
		{
			date: '2025 — Present',
			role: 'Full Stack Developer',
			company: 'Praxis Loop'
		},
		{
			date: '2022 — 2023',
			role: 'Production Designer',
			company: 'Lookout'
		},
		{
			date: '2021 — Present',
			role: 'Badminton Head Coach',
			company: 'Reflex'
		}
	];

	const technologies = [
		{
			label: 'Systems & Hardware',
			items: [
				'Windows installation and configuration',
				'Arch Linux',
				'WSL',
				'PC assembly',
				'BIOS updates'
			]
		},
		{ label: 'Package Managers', items: ['winget', 'Scoop', 'pacman'] },
		{
			label: 'Web & Tools',
			items: [
				'WordPress',
				'Prismic',
				'REST APIs',
				'Postman',
				'Insomnia',
				'Git',
				'GitHub',
				'Vercel',
				'Coolify'
			]
		},
		{
			label: 'Development',
			items: [
				'PostgreSQL',
				'SQLite',
				'SQL',
				'JavaScript',
				'TypeScript',
				'HTML',
				'CSS',
				'GitHub Actions',
				'Playwright'
			]
		}
	];
</script>

<svelte:head>
	<title>Hugo Hsi — Full-stack Developer</title>
	<meta
		name="description"
		content="Hugo Hsi is a Brooklyn-based full-stack developer with production experience in CMS migrations, web applications, client support, and Linux deployments."
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

{#snippet arrow()}<span aria-hidden="true">↗</span>{/snippet}
{#snippet github()}
	<svg
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
	>
{/snippet}
{#snippet linkedin()}
	<svg
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
	>
{/snippet}

<a class="skip-link" href="#main">Skip to content</a>
<div class="scroll-progress" aria-hidden="true">
	<span style:transform={`scaleY(${progress})`}></span>
</div>
<header class="site-nav">
	<a
		class="nav-name"
		use:magnetic={0.2}
		class:visible={showName}
		href="#top"
		aria-label="Hugo Hsi, back to top"><span data-magnetic-content>Hugo Hsi</span></a
	>
	<nav class="socials" aria-label="Social links">
		<a href="https://github.com/hugo-hsi-dev" aria-label="GitHub" use:magnetic
			><span data-magnetic-content>{@render github()}</span></a
		>
		<a href="https://www.linkedin.com/in/hugo-hsi" aria-label="LinkedIn" use:magnetic
			><span data-magnetic-content>{@render linkedin()}</span></a
		>
	</nav>
</header>

<main id="main">
	<section class="hero" id="top" aria-labelledby="hero-title">
		<div class="hero-grid container">
			<div class="hero-copy">
				<p class="eyebrow" bind:this={heroName}>Hugo Hsi</p>
				<h1 id="hero-title" class="typewriter">
					<span class="screen-reader-only">{headline}</span>
					<span class="headline-text" aria-hidden="true"
						>{typedHeadline}{#if showCursor}<span class="typing-cursor" class:complete={!typing}
							></span>{/if}<span class="headline-remainder"
							>{headline.slice(typedHeadline.length)}</span
						></span
					>
				</h1>
				<p class="intro">
					Full-stack developer with production web experience across CMS migrations, client support,
					REST API debugging, CI/CD, and Linux-based deployments.
				</p>
				<div class="hero-actions">
					<a class="button" href="#projects"><span class="button-label">View my work</span></a>
					<a class="button outline" href={asset('/resume.pdf')} download="Hugo-Hsi-Resume.pdf"
						><span class="button-label">Download resume</span></a
					>
				</div>
			</div>
			<aside class="hero-quote">
				<p>
					<span aria-hidden="true">“</span> Comfortable tracing issues through frontend, CMS, API,
					and database layers. <span aria-hidden="true">”</span>
				</p>
				<span class="eyebrow">Brooklyn, New York</span>
			</aside>
		</div>
	</section>

	<section class="section projects" id="projects" aria-labelledby="projects-title">
		<div class="container">
			<header class="section-heading">
				<h2 id="projects-title">Projects &amp; Technical Experience</h2>
				<span class="counter">{projects.length + clientWork.length} Entries</span>
			</header>
			<div class="client-projects">
				<h3 class="category">Client work at Praxis Loop</h3>
				<div class="client-work" aria-label="Client websites at Praxis Loop">
					{#each clientWork as site (site.url)}
						<!-- eslint-disable svelte/no-navigation-without-resolve -- Client URLs are external destinations. -->
						<a
							class="client-site"
							class:og-image={site.title === '1st Avenue Advisors'}
							href={site.url}
						>
							{#if site.image}<img src={site.image} alt={site.alt} loading="lazy" />{/if}
							<span class="text-link"
								><span class="link-label">{site.title}</span> {@render arrow()}</span
							>
						</a>
						<!-- eslint-enable svelte/no-navigation-without-resolve -->
					{/each}
				</div>
			</div>
			<div class="project-list">
				{#each projects as project (project.title)}
					<article class="project" class:technical={!project.image}>
						<!-- eslint-disable svelte/no-navigation-without-resolve -- Project URLs are external destinations. -->
						{#if project.image}
							<a
								class="project-image personal"
								href={project.url}
								aria-label={`Visit ${project.title}`}
							>
								<img
									src={project.image}
									alt={project.alt}
									width="1440"
									height="960"
									loading="lazy"
								/>
							</a>
						{:else}
							<div class="technical-heading">
								<span class="category personal">{project.category}</span>
								<h3>{project.title}</h3>
							</div>
						{/if}
						<div class="project-copy">
							{#if project.image}<span class="category personal">{project.category}</span>
								<h3>{project.title}</h3>{/if}
							<p>{project.description}</p>
							<ul class="tags">
								{#each project.technologies as technology (technology)}<li>{technology}</li>{/each}
							</ul>
							{#if project.url}<a class="text-link" href={project.url}
									><span class="link-label">Visit site</span> {@render arrow()}</a
								>{/if}
						</div>
					</article>
					<!-- eslint-enable svelte/no-navigation-without-resolve -->
				{/each}
			</div>
		</div>
	</section>

	<section class="section dark" id="experience" aria-labelledby="experience-title">
		<div class="container">
			<header class="section-heading">
				<h2 id="experience-title">Experience</h2>
				<span class="counter">{experience.length} Roles</span>
			</header>
			<div class="timeline">
				{#each experience as item (item.company)}
					<article class="timeline-item">
						<p class="date">{item.date}</p>
						<h3>{item.role}</h3>
						<p class="subtitle">{item.company}</p>
					</article>
				{/each}
			</div>
		</div>
	</section>

	<section class="section dark education" aria-labelledby="education-title">
		<div class="container">
			<header class="section-heading">
				<h2 id="education-title">Education</h2>
				<span class="counter">2 Programs</span>
			</header>
			<div class="timeline">
				<article class="timeline-item">
					<p class="date">2024</p>
					<h3>Full Stack Web Development Bootcamp</h3>
					<p class="subtitle">Columbia University</p>
				</article>
				<article class="timeline-item">
					<p class="date">2023</p>
					<h3>Bachelor of Fine Arts in Communication Design</h3>
					<p class="subtitle">The New School</p>
				</article>
			</div>
		</div>
	</section>

	<section class="section" aria-labelledby="tech-title">
		<div class="container">
			<header class="section-heading"><h2 id="tech-title">Technical Skills</h2></header>
			<div class="tech-grid">
				{#each technologies as group (group.label)}<div class="tech-group">
						<h3>{group.label}</h3>
						<ul>
							{#each group.items as item (item)}<li>{item}</li>{/each}
						</ul>
					</div>{/each}
			</div>
		</div>
	</section>
</main>

<footer class="site-footer dark" id="contact">
	<div class="container">
		<div class="footer-grid">
			<div>
				<h2>Let’s work together</h2>
				<p>
					Full-stack development, thoughtful design, and hands-on production experience. Based in
					Brooklyn, New York.
				</p>
			</div>
			<div class="footer-contact">
				<a class="email" use:magnetic={0.15} href="mailto:hugohsidev@gmail.com"
					><span data-magnetic-content
						><svg
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							aria-hidden="true"
							><rect x="3" y="5" width="18" height="14" rx="1" /><path d="m3 6 9 7 9-7" /></svg
						>hugohsidev@gmail.com</span
					></a
				>
				<div class="socials">
					<a class="text-link" href="mailto:hugohsidev@gmail.com"
						><span class="link-label">Email</span></a
					>
					<a class="text-link" href="https://github.com/hugo-hsi-dev"
						><span class="link-label">GitHub</span></a
					><a class="text-link" href="https://www.linkedin.com/in/hugo-hsi"
						><span class="link-label">LinkedIn</span></a
					>
				</div>
			</div>
		</div>
		<div class="footer-bottom">
			<span>© {new Date().getFullYear()} Hugo Hsi. All rights reserved.</span><span
				>Built with SvelteKit, Cloudflare, and attention to detail.</span
			>
		</div>
	</div>
</footer>
