<script lang="ts">
	const projects = [
		{
			id: 'museum',
			context: 'Praxis Loop · Production platform',
			title: 'Rebuilding a museum site around its editors.',
			intro:
				'I helped replatform a 3,500+ page public website from WordPress to Prismic, shaping the content system around how an editorial team actually publishes.',
			proof: [
				'Created reusable, editor-friendly content models',
				'Helped consolidate three UI approaches into one Tailwind system',
				'Built visual regression coverage for changes ordinary tests could miss'
			],
			outcome: 'A clearer publishing system, a more consistent interface, and safer releases.',
			stack: ['Prismic', 'Tailwind CSS', 'Playwright', 'GitHub Actions'],
			link: 'https://mohmuseum.org',
			linkLabel: 'Visit the museum site',
			code: undefined
		},
		{
			id: 'minecentral',
			context: 'Independent product · Full stack',
			title: 'One product from checkout to server control.',
			intro:
				'MineCentral turns Minecraft hosting into a product experience: choose a plan, manage a subscription, and monitor the running instance from one place.',
			proof: [
				'Connected account and subscription flows through Stripe',
				'Integrated Pterodactyl for live instance monitoring and control',
				'Designed across marketing, checkout, dashboard, and operations'
			],
			outcome: 'A complete product path across interface, billing, and infrastructure.',
			stack: ['TypeScript', 'Next.js', 'PostgreSQL', 'Stripe', 'Pterodactyl'],
			link: 'https://www.minecentral.net',
			linkLabel: 'Open MineCentral',
			code: 'https://github.com/Minecentral-Official/Minecentral-Dashboard'
		},
		{
			id: 'budget',
			context: 'Independent product · SvelteKit PWA',
			title: 'A weekly budget you can see moving.',
			intro:
				'Me Save Money reduces budgeting to one useful answer: what can I still spend? Purchases update the remaining amount without turning money into a spreadsheet chore.',
			proof: [
				'Designed a mobile-first purchase flow for everyday use',
				'Used experimental remote functions for a typed server-client boundary',
				'Built the experience as an installable progressive web app'
			],
			outcome: 'A focused financial tool built around one legible decision.',
			stack: ['SvelteKit', 'TypeScript', 'PWA', 'Remote functions'],
			link: undefined,
			linkLabel: '',
			code: 'https://github.com/hugo-hsi-dev/expense-tracker'
		}
	] as const;

	const capabilities = [
		{
			label: 'Product UI',
			items: ['SvelteKit', 'React', 'Next.js', 'Tailwind CSS', 'MUI', 'shadcn/ui']
		},
		{
			label: 'Systems',
			items: ['TypeScript', 'Node.js', 'PostgreSQL', 'Prismic', 'WordPress', 'Stripe']
		},
		{
			label: 'Practice',
			items: [
				'Content modeling',
				'Design systems',
				'Playwright',
				'Visual QA',
				'Motion design',
				'AI workflows'
			]
		}
	] as const;

	const experience = [
		{
			company: 'Praxis Loop',
			role: 'Full-stack developer · Contract',
			period: '2025—Now',
			description:
				'I work on the seams that determine whether a product holds together: content architecture, component systems, test coverage, and more reliable AI-assisted development workflows.',
			tags: ['CMS architecture', 'Design systems', 'Visual regression', 'Context engineering']
		},
		{
			company: 'Lookout',
			role: 'Design production intern',
			period: '2022—2023',
			description:
				'I helped bring motion production in-house and created reusable brand assets for marketing. Work produced for RSAC was recognized with a GDUSA American Inhouse Design Award.',
			tags: ['Motion graphics', 'Brand systems', 'Production design']
		}
	] as const;
</script>

<svelte:head>
	<title>Hugo Hsi — Design-trained full-stack developer</title>
	<meta
		name="description"
		content="Hugo Hsi is a Brooklyn-based full-stack developer with a communication design background, building clear interfaces and durable web systems."
	/>
	<meta property="og:title" content="Hugo Hsi — Design-trained full-stack developer" />
	<meta
		property="og:description"
		content="Selected work across content systems, product interfaces, design systems, and visual QA."
	/>
	<meta property="og:type" content="website" />
	<meta name="theme-color" content="#f2f5f3" />
</svelte:head>

<a class="skip-link" href="#work">Skip to work</a>

<header class="site-header" id="top">
	<a class="identity" href="#top" aria-label="Hugo Hsi, back to top"
		><span aria-hidden="true">HH</span> Hugo Hsi</a
	>
	<nav aria-label="Primary navigation">
		<a href="#work">Work</a><a href="#experience">Experience</a><a href="#about">About</a>
	</nav>
	<span class="location"><i aria-hidden="true"></i>Brooklyn, NY</span>
</header>

<main>
	<section class="hero" aria-labelledby="hero-title">
		<div class="hero-copy">
			<p class="eyebrow">Full-stack developer · Communication designer</p>
			<h1 id="hero-title">I make complex systems <em>feel simple.</em></h1>
			<p class="hero-summary">
				I work across content architecture, product interfaces, and the engineering systems that
				keep both reliable.
			</p>
			<div class="hero-links">
				<a class="button" href="#work">See selected work <span aria-hidden="true">↓</span></a>
				<a href="mailto:hugohsidev@gmail.com">Email</a>
				<a href="https://www.linkedin.com/in/hugo-hsi" rel="noreferrer">LinkedIn</a>
				<a href="https://github.com/hugo-hsi-dev" rel="noreferrer">GitHub</a>
			</div>
		</div>

		<div
			class="build-trace"
			aria-label="A working path from content model to design system to visual quality assurance"
		>
			<div class="trace-header">
				<span>How the work holds together</span><span>HH / TRACE</span>
			</div>
			<div class="trace-canvas">
				<svg
					viewBox="0 0 460 310"
					role="img"
					aria-label="Content model connects to design system, which connects to visual quality assurance"
				>
					<path class="trace-path" d="M72 68 C210 68 164 155 250 155 S288 242 388 242" />
					<circle cx="72" cy="68" r="11" /><circle cx="250" cy="155" r="11" /><circle
						cx="388"
						cy="242"
						r="11"
					/>
				</svg>
				<div class="trace-node node-one">
					<b>01</b><strong>Content model</strong><small>People can publish</small>
				</div>
				<div class="trace-node node-two">
					<b>02</b><strong>Design system</strong><small>Products stay coherent</small>
				</div>
				<div class="trace-node node-three">
					<b>03</b><strong>Visual QA</strong><small>Changes ship safely</small>
				</div>
			</div>
			<div class="trace-footer">
				<span>Clear for people</span><span>Durable in production</span>
			</div>
		</div>
	</section>

	<section class="proof-strip" aria-label="Selected evidence">
		<div><strong>3,500+</strong><span>pages replatformed</span></div>
		<div><strong>3 → 1</strong><span>styling systems unified</span></div>
		<div><strong>Visual QA</strong><span>added to release checks</span></div>
		<div><strong>Motion</strong><span>brought in-house</span></div>
	</section>

	<section class="work-section" id="work" aria-labelledby="work-title">
		<header class="section-heading">
			<div>
				<p class="eyebrow">Selected work</p>
				<h2 id="work-title">Proof, not a project grid.</h2>
			</div>
			<p>
				Three projects that show how I move between content, interface, application logic, and
				infrastructure.
			</p>
		</header>

		<div class="project-list">
			{#each projects as project, index (project.id)}
				<article class="project">
					<div class="project-visual {project.id}" aria-hidden="true">
						<div class="visual-bar">
							<span>{String(index + 1).padStart(2, '0')} / 03</span><span>System view</span>
						</div>
						{#if project.id === 'museum'}
							<div class="museum-ui">
								<aside><i></i><i></i><i></i><i></i></aside>
								<div class="content-tree">
									<b>Page</b><span class="connector"></span>
									<div><span>Hero</span><span>Story</span><span>Related</span></div>
									<div class="subnodes"><span>Image</span><span>Quote</span><span>CTA</span></div>
								</div>
							</div>
						{:else if project.id === 'minecentral'}
							<div class="server-ui">
								<header>
									<i></i><span><small>SERVER 01</small><b>Online</b></span><em>48 ms</em>
								</header>
								<svg viewBox="0 0 400 150" preserveAspectRatio="none"
									><path d="M0 112 C55 105 50 42 105 68 S190 124 224 72 S310 31 400 45" /></svg
								>
								<div class="metrics">
									<span><small>CPU</small><b>32%</b></span><span
										><small>MEMORY</small><b>4.8 GB</b></span
									><span><small>PLAYERS</small><b>12 / 40</b></span>
								</div>
							</div>
						{:else}
							<div class="budget-ui">
								<div>
									<small>LEFT THIS WEEK</small><b>$184<sup>.60</sup></b><i><span></span></i>
								</div>
								<ul>
									<li><span>GR</span><b>Groceries</b><em>− $42.18</em></li>
									<li><span>TR</span><b>Transit</b><em>− $2.90</em></li>
									<li><span>CF</span><b>Coffee</b><em>− $5.25</em></li>
								</ul>
							</div>
						{/if}
					</div>

					<div class="project-copy">
						<p class="eyebrow">{project.context}</p>
						<h3>{project.title}</h3>
						<p class="intro">{project.intro}</p>
						<div class="contributions">
							<span>What I did</span>
							<ul>
								{#each project.proof as item (item)}<li>{item}</li>{/each}
							</ul>
						</div>
						<p class="outcome">{project.outcome}</p>
						<ul class="tags" aria-label="Technologies used">
							{#each project.stack as item (item)}<li>{item}</li>{/each}
						</ul>
						<div class="project-links">
							{#if project.link}
								<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- external URL -->
								<a href={project.link} rel="noreferrer"
									>{project.linkLabel}<span aria-hidden="true">↗</span></a
								>{/if}
							{#if project.code}
								<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- external URL -->
								<a class="secondary" href={project.code} rel="noreferrer"
									>View code<span aria-hidden="true">↗</span></a
								>{/if}
						</div>
					</div>
				</article>
			{/each}
		</div>
	</section>

	<section class="experience-section" id="experience" aria-labelledby="experience-title">
		<header class="section-heading compact">
			<div>
				<p class="eyebrow">Experience</p>
				<h2 id="experience-title">Where the work happened.</h2>
			</div>
		</header>
		<div class="experience-list">
			{#each experience as item (item.company)}
				<article>
					<div>
						<h3>{item.company}</h3>
						<p>{item.role}</p>
					</div>
					<time>{item.period}</time>
					<div>
						<p>{item.description}</p>
						<ul class="tags">
							{#each item.tags as tag (tag)}<li>{tag}</li>{/each}
						</ul>
					</div>
				</article>
			{/each}
		</div>
	</section>

	<section class="capabilities-section" aria-labelledby="capabilities-title">
		<div>
			<p class="eyebrow">Capabilities</p>
			<h2 id="capabilities-title">A searchable index of how I build.</h2>
			<p class="section-copy">
				Tools change. The through-line is moving from a fuzzy problem to a clear, maintainable
				product.
			</p>
		</div>
		<div class="capability-list">
			{#each capabilities as group (group.label)}<div>
					<h3>{group.label}</h3>
					<ul>
						{#each group.items as item (item)}<li>{item}</li>{/each}
					</ul>
				</div>{/each}
		</div>
	</section>

	<section class="about-section" id="about" aria-labelledby="about-title">
		<div class="about-heading">
			<p class="eyebrow">About</p>
			<h2 id="about-title">
				I learned to design how things communicate. Then I learned to build how they work.
			</h2>
		</div>
		<div class="about-copy">
			<p>
				That combination shapes how I approach software. I care about the visible layer—type,
				motion, hierarchy, interaction—but also the content model, component system, and test
				coverage that keep it coherent after launch.
			</p>
			<p>
				I’m based in Brooklyn and do my best work where design and engineering talk to each other
				early.
			</p>
		</div>
		<div class="education">
			<span>Education</span>
			<article>
				<time>2024</time><strong>Columbia University</strong>
				<p>Full-stack web development</p>
			</article>
			<article>
				<time>2023</time><strong>The New School</strong>
				<p>BFA, Communication Design</p>
			</article>
		</div>
	</section>

	<section class="contact-section" aria-labelledby="contact-title">
		<p class="eyebrow">Details</p>
		<div class="contact-heading">
			<h2 id="contact-title">Everything you came looking for.</h2>
			<span>Brooklyn, New York</span>
		</div>
		<div class="contact-links">
			<a href="mailto:hugohsidev@gmail.com"
				><span>Email</span><strong>hugohsidev@gmail.com</strong><i aria-hidden="true">↗</i></a
			>
			<a href="https://www.linkedin.com/in/hugo-hsi" rel="noreferrer"
				><span>LinkedIn</span><strong>/in/hugo-hsi</strong><i aria-hidden="true">↗</i></a
			>
			<a href="https://github.com/hugo-hsi-dev" rel="noreferrer"
				><span>GitHub</span><strong>@hugo-hsi-dev</strong><i aria-hidden="true">↗</i></a
			>
		</div>
	</section>
</main>

<footer>
	<span>© {new Date().getFullYear()} Hugo Hsi</span><span
		>Designed in Brooklyn · Built with SvelteKit</span
	><a href="#top">Back to top ↑</a>
</footer>
