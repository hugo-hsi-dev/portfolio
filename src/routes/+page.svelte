<script lang="ts">
	import { onMount } from 'svelte';

	const systems = [
		{
			index: '01',
			label: 'Content architecture',
			claim: 'A 3,500+ page migration designed for the people editing it.',
			description:
				'I migrated a museum site from WordPress to Prismic and designed editor-friendly content models for the new system.',
			evidence: ['WordPress', 'Prismic'],
			measure: '3,500+ pages'
		},
		{
			index: '02',
			label: 'Interface systems',
			claim: 'Three styling systems brought into one shared language.',
			description:
				'I unified MUI, Styled Components, and shadcn/ui into one Tailwind system for interface work.',
			evidence: ['3 systems', 'Tailwind'],
			measure: '3 → 1'
		},
		{
			index: '03',
			label: 'Visual verification',
			claim: 'A repeatable check for regressions people can see.',
			description:
				'I built a Playwright and GitHub Actions visual-regression pipeline that puts reviewable UI comparisons into CI.',
			evidence: ['Change', 'Compare', 'Review'],
			measure: 'Playwright + GitHub Actions'
		}
	];

	const products = [
		{
			index: '01',
			name: 'MineCentral',
			type: 'Minecraft server hosting platform',
			url: 'https://minecentral.net',
			artifact: '/images/minecentral-console.png',
			artifactAlt:
				'MineCentral server console showing instance status, live logs, memory, and CPU usage',
			description:
				'Built a platform where users can create servers, manage Stripe subscriptions, and monitor instances in real time through the Pterodactyl dashboard.',
			steps: ['Create', 'Subscribe', 'Monitor'],
			stepNotes: ['Configure a server', 'Manage access with Stripe', 'Read instance state']
		},
		{
			index: '02',
			name: 'Me Save Money',
			type: 'Budgeting PWA',
			url: null,
			artifact: null,
			artifactAlt: '',
			description:
				'Built a SvelteKit PWA for recording purchases, setting a weekly budget, and seeing remaining spending update in real time.',
			steps: ['Record', 'Budget', 'Remaining'],
			stepNotes: ['Add a purchase', 'Set the week’s limit', 'See spending update']
		}
	];

	const experience = [
		{
			company: 'Praxis Loop',
			role: 'Full-stack developer (contractor)',
			period: 'Oct 2025 — present',
			description:
				'Content architecture, interface-system consolidation, and visual-regression tooling for complex digital products.'
		},
		{
			company: 'Lookout',
			role: 'Design production intern',
			period: '2022 — 2023',
			description:
				'Brought motion production in-house and created reusable brand assets. Motion work shown at the RSAC booth contributed to a GDUSA American Inhouse Design Award for the booth.'
		}
	];

	const education = [
		{
			school: 'Columbia University',
			program: 'Full Stack Web Development Bootcamp',
			date: 'May 2024'
		},
		{ school: 'The New School', program: 'BFA, Communication Design', date: 'May 2023' }
	];

	let page: HTMLElement;
	let hero: HTMLElement;
	let systemsChapter: HTMLElement;
	let contact: HTMLElement;
	let productList: HTMLElement;
	let productElements: HTMLElement[] = [];

	onMount(() => {
		const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
		const wideViewport = window.matchMedia('(min-width: 761px)');
		let frame = 0;
		productElements = Array.from(productList.querySelectorAll<HTMLElement>('.product-record'));

		if (!reducedMotion.matches && !sessionStorage.getItem('hugo-intro-seen')) {
			page.dataset.intro = 'play';
			sessionStorage.setItem('hugo-intro-seen', 'true');
			window.setTimeout(() => delete page.dataset.intro, 1200);
		}

		const clamp = (value: number) => Math.min(1, Math.max(0, value));

		const update = () => {
			frame = 0;
			if (reducedMotion.matches) return;

			const viewport = window.innerHeight;
			const heroRect = hero.getBoundingClientRect();
			const heroProgress = clamp(-heroRect.top / Math.max(heroRect.height * 0.7, 1));
			hero.style.setProperty('--hero-progress', heroProgress.toFixed(3));

			if (wideViewport.matches) {
				const systemsRect = systemsChapter.getBoundingClientRect();
				const systemsProgress = clamp(
					-systemsRect.top / Math.max(systemsRect.height - viewport, 1)
				);
				systemsChapter.style.setProperty('--systems-progress', systemsProgress.toFixed(3));
				systemsChapter.dataset.active = String(Math.min(2, Math.floor(systemsProgress * 3)));
			}

			productElements.forEach((element) => {
				const rect = element.getBoundingClientRect();
				const progress = clamp((viewport * 0.82 - rect.top) / Math.max(rect.height * 0.76, 1));
				element.style.setProperty('--product-progress', progress.toFixed(3));
				element.dataset.active = String(Math.min(2, Math.floor(progress * 3)));
			});

			const contactRect = contact.getBoundingClientRect();
			const contactProgress = clamp((viewport * 0.88 - contactRect.top) / (viewport * 0.55));
			contact.style.setProperty('--contact-progress', contactProgress.toFixed(3));
		};

		const requestUpdate = () => {
			if (!frame) frame = requestAnimationFrame(update);
		};

		update();
		window.addEventListener('scroll', requestUpdate, { passive: true });
		window.addEventListener('resize', requestUpdate);
		reducedMotion.addEventListener('change', requestUpdate);

		return () => {
			if (frame) cancelAnimationFrame(frame);
			window.removeEventListener('scroll', requestUpdate);
			window.removeEventListener('resize', requestUpdate);
			reducedMotion.removeEventListener('change', requestUpdate);
		};
	});
</script>

<svelte:head>
	<title>Hugo Hsi — Full-stack developer</title>
	<meta
		name="description"
		content="Hugo Hsi is a full-stack developer making complex products clearer to use and more coherent to change."
	/>
	<meta property="og:title" content="Hugo Hsi — Full-stack developer" />
	<meta
		property="og:description"
		content="Complex products, made clearer to use and more coherent to change."
	/>
	<meta name="theme-color" content="#f2efe7" />
</svelte:head>

<div class="page" bind:this={page}>
	<a class="skip-link" href="#main-content">Skip to content</a>
	<header class="site-header">
		<a class="wordmark" href="#main-content" aria-label="Hugo Hsi, back to top">Hugo Hsi</a>
		<nav class="site-nav" aria-label="Primary navigation">
			<a href="#systems">Systems</a><a href="#products">Products</a><a href="#background"
				>Background</a
			>
		</nav>
		<a class="header-email action-link" href="mailto:hugohsidev@gmail.com"
			><span>Email Hugo</span><span aria-hidden="true">↗</span></a
		>
	</header>

	<main id="main-content">
		<section class="hero" bind:this={hero} aria-labelledby="hero-title">
			<div class="hero-eyebrow system-label">
				<span>Full-stack developer</span><span aria-hidden="true">·</span><span>Brooklyn, NY</span>
			</div>
			<h1 id="hero-title">
				<span class="hero-line hero-line-one">Design taught me to read systems.</span>
				<span class="hero-line hero-line-two">Engineering taught me to rewrite them.</span>
				<span class="intro-caret" aria-hidden="true"></span>
			</h1>
			<div class="hero-lower">
				<p class="hero-summary">
					I’m Hugo Hsi, a full-stack developer making complex products clearer for the people who
					use them—and more coherent for the teams who change them.
				</p>
				<div class="hero-actions">
					<a class="action-link" href="#systems"
						><span>See selected work</span><span aria-hidden="true">↓</span></a
					>
					<a class="action-link" href="mailto:hugohsidev@gmail.com"
						><span>Email me</span><span aria-hidden="true">↗</span></a
					>
				</div>
			</div>
		</section>

		<section
			class="systems-chapter"
			id="systems"
			bind:this={systemsChapter}
			aria-labelledby="systems-title"
			data-active="0"
		>
			<header class="chapter-intro">
				<p class="system-label">Praxis Loop · Systems</p>
				<h2 id="systems-title">Clear on the surface.<br />Coherent underneath.</h2>
				<p class="chapter-description">
					At Praxis Loop, I work across content architecture, interface systems, and the checks that
					keep visual intent intact.
				</p>
				<p class="chapter-scope system-type">Role: full-stack developer (contractor)</p>
			</header>
			<div class="systems-layout">
				<div class="system-records">
					{#each systems as system, index (system.label)}
						<article class="system-record" data-index={index}>
							<div class="record-heading">
								<span class="system-label">{system.index}</span>
								<p class="system-label">{system.label}</p>
							</div>
							<h3>{system.claim}</h3>
							<p class="record-description">{system.description}</p>
							<p class="record-evidence system-type">{system.measure}</p>
							<div class="mobile-proof" aria-hidden="true">
								{#each system.evidence as item, itemIndex (item)}
									<span>{item}</span>{#if itemIndex < system.evidence.length - 1}<i>→</i>{/if}
								{/each}
							</div>
						</article>
					{/each}
				</div>
				<div class="proof-column" aria-hidden="true">
					<div class="proof-field">
						<p class="proof-status system-label"><span></span>Relationship under inspection</p>
						<div class="proof-scenes">
							{#each systems as system, index (system.label)}
								<div class="proof-scene" data-index={index}>
									<p class="proof-measure system-type">{system.measure}</p>
									<div class="proof-flow">
										{#each system.evidence as item, itemIndex (item)}
											<span>{item}</span>{#if itemIndex < system.evidence.length - 1}<i>→</i>{/if}
										{/each}
									</div>
								</div>
							{/each}
						</div>
						<div class="proof-progress"><span></span></div>
						<p class="proof-count system-type">01 — 03</p>
					</div>
				</div>
			</div>
		</section>

		<section class="products-section" id="products" aria-labelledby="products-title">
			<header class="section-intro">
				<p class="system-label">Independent products</p>
				<h2 id="products-title">Products that make<br />state understandable.</h2>
				<p>
					Independent builds focused on technical and financial systems people need to read at a
					glance.
				</p>
			</header>
			<div class="product-list" bind:this={productList}>
				{#each products as product (product.name)}
					<article class="product-record" data-active="0">
						<header class="product-copy">
							<div class="product-index system-label">{product.index} / 02</div>
							<div class="product-title-block">
								<p class="product-type system-label">{product.type}</p>
								<div class="product-title-row">
									<h3>{product.name}</h3>
									{#if product.url}
										<a class="action-link" href={product.url} target="_blank" rel="noreferrer">
											<span>Visit site</span><span aria-hidden="true">↗</span>
										</a>
									{/if}
								</div>
							</div>
							<p>{product.description}</p>
						</header>
						{#if product.artifact}
							<figure class="product-artifact">
								<img src={product.artifact} alt={product.artifactAlt} loading="lazy" />
								<figcaption>
									<span class="system-label">Live product interface</span>
									<ol aria-label={`${product.name} functional sequence`}>
										{#each product.steps as step, stepIndex (step)}
											<li data-step={stepIndex}>{step}</li>
										{/each}
									</ol>
								</figcaption>
							</figure>
						{:else}
							<div class="product-sequence" aria-label={`${product.name} functional sequence`}>
								<div class="sequence-line" aria-hidden="true"><span></span></div>
								<ol>
									{#each product.steps as step, stepIndex (step)}
										<li data-step={stepIndex}>
											<span class="step-marker system-type">0{stepIndex + 1}</span>
											<div><strong>{step}</strong><span>{product.stepNotes[stepIndex]}</span></div>
										</li>
									{/each}
								</ol>
							</div>
						{/if}
					</article>
				{/each}
			</div>
		</section>

		<section class="background-section" id="background" aria-labelledby="background-title">
			<header class="background-intro">
				<p class="system-label">Background</p>
				<h2 id="background-title">One practice,<br />trained from two directions.</h2>
				<p class="background-lead">
					Communication design trained my attention to hierarchy, language, and coherence.
					Engineering lets me carry that attention into content models, interface rules, tooling,
					and tests.
				</p>
			</header>
			<div class="background-records">
				<section aria-labelledby="experience-label">
					<h3 class="system-label" id="experience-label">Experience</h3>
					{#each experience as item (item.company)}
						<article class="history-record">
							<div>
								<h4>{item.company}</h4>
								<p>{item.role}</p>
							</div>
							<p class="system-type">{item.period}</p>
							<p>{item.description}</p>
						</article>
					{/each}
				</section>
				<section aria-labelledby="education-label">
					<h3 class="system-label" id="education-label">Education</h3>
					{#each education as item (item.school)}
						<article class="education-record">
							<div>
								<h4>{item.school}</h4>
								<p>{item.program}</p>
							</div>
							<p class="system-type">{item.date}</p>
						</article>
					{/each}
				</section>
			</div>
		</section>

		<section
			class="contact-section"
			id="contact"
			bind:this={contact}
			aria-labelledby="contact-title"
		>
			<p class="system-label">Contact</p>
			<div class="contact-heading">
				<h2 id="contact-title">What needs to<br />become clearer?</h2>
				<p>Tell me about the product, system, or next change.</p>
			</div>
			<a class="contact-link" href="mailto:hugohsidev@gmail.com"
				><span class="contact-rule" aria-hidden="true"><i></i></span><span
					>hugohsidev@gmail.com</span
				><span class="contact-arrow" aria-hidden="true">↗</span></a
			>
		</section>
	</main>

	<footer class="site-footer">
		<span>Hugo Hsi</span><a href="https://linkedin.com/in/hugo-hsi" target="_blank" rel="noreferrer"
			>LinkedIn ↗</a
		><span>Brooklyn, NY</span>
	</footer>
</div>
