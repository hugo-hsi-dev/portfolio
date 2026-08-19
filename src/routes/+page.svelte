<script lang="ts">
	import { contact, experience, principles, projects } from '#lib/portfolio.js';
	import BrandIcon from '#lib/ui/BrandIcon.svelte';
	import ProjectStory from '#lib/ui/ProjectStory.svelte';
</script>

<svelte:head>
	<title>Hugo Hsi | Full-Stack Developer</title>
	<meta
		name="description"
		content="Hugo Hsi is a New York City full-stack developer who brings design judgment to content systems, product engineering, and production tooling."
	/>
	<link rel="canonical" href="https://www.hugohsi.dev/" />
	<meta property="og:type" content="website" />
	<meta property="og:title" content="Hugo Hsi | Full-Stack Developer" />
	<meta
		property="og:description"
		content="Design taught me to find the right problem. Engineering taught me how to solve it."
	/>
	<meta property="og:url" content="https://www.hugohsi.dev/" />
	<meta name="twitter:card" content="summary" />
	<meta name="theme-color" content="#f1f4ef" />
</svelte:head>

<a
	href="#main"
	class="fixed top-3 left-3 z-50 -translate-y-24 rounded-control bg-ink px-4 py-3 text-sm font-semibold text-field transition-transform focus:translate-y-0"
>
	Skip to content
</a>

<header class="sticky top-0 z-40 border-b border-rule bg-field/95 backdrop-blur-sm">
	<div class="mx-auto flex h-16 max-w-[80rem] items-center justify-between px-5 sm:px-8 lg:px-10">
		<a href="#top" class="inline-flex min-h-11 items-center text-sm font-semibold tracking-tight"
			>Hugo Hsi</a
		>
		<nav aria-label="Primary" class="flex items-center gap-5 text-sm sm:gap-7">
			<a
				href="#work"
				class="inline-flex min-h-11 items-center px-1.5 transition-colors hover:text-build">Work</a
			>
			<a
				href="#approach"
				class="hidden min-h-11 items-center px-1.5 transition-colors hover:text-build sm:inline-flex"
				>Approach</a
			>
			<a
				href="#contact"
				class="inline-flex min-h-11 items-center px-1.5 transition-colors hover:text-build"
				>Contact</a
			>
			<a
				href={contact.resume}
				target="_blank"
				rel="noreferrer"
				class="hidden min-h-11 items-center rounded-control border border-ink px-3.5 py-2 font-semibold transition-colors hover:bg-ink hover:text-field md:inline-flex"
			>
				Résumé ↗
			</a>
		</nav>
	</div>
</header>

<main id="main">
	<section
		id="top"
		aria-labelledby="hero-title"
		class="mx-auto grid min-h-[calc(100svh-4rem)] max-w-[80rem] content-between px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24"
	>
		<div class="grid items-start gap-16 lg:grid-cols-12 lg:gap-8">
			<div class="lg:col-span-8">
				<p
					class="mb-8 flex flex-wrap items-center gap-3 text-xs font-semibold tracking-[0.13em] uppercase"
				>
					<span class="text-diagnose">Full-stack developer</span>
					<span aria-hidden="true" class="h-px w-8 bg-rule"></span>
					<span class="text-muted">New York City</span>
				</p>

				<h1 id="hero-title">
					<span
						class="block max-w-[15ch] font-display text-[clamp(3.3rem,7.3vw,7rem)] leading-[0.88] tracking-[-0.025em]"
					>
						Design taught me to find the right problem.
					</span>
					<span
						class="mt-5 block max-w-[14ch] font-body text-[clamp(2.75rem,6.3vw,6rem)] leading-[0.91] font-semibold tracking-[-0.055em]"
					>
						Engineering taught me how to solve it.
					</span>
				</h1>

				<p class="mt-9 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">
					I build maintainable products by following the real problem through interface, content,
					code, and infrastructure.
				</p>

				<div class="mt-9 flex flex-wrap gap-3">
					<a
						href="#work"
						class="inline-flex min-h-11 items-center gap-3 rounded-control bg-ink px-5 py-3 text-sm font-semibold text-field transition-colors hover:bg-build"
					>
						See selected work <span aria-hidden="true">↓</span>
					</a>
					<a
						href={contact.resume}
						target="_blank"
						rel="noreferrer"
						class="inline-flex min-h-11 items-center rounded-control border border-ink px-5 py-3 text-sm font-semibold transition-colors hover:bg-ink hover:text-field"
					>
						Download résumé
					</a>
				</div>
			</div>

			<aside class="lg:col-span-4 lg:mt-11 lg:pl-8" aria-label="Hugo's working trace">
				<p class="mb-7 font-utility text-[0.68rem] tracking-[0.12em] text-muted uppercase">
					The working trace
				</p>
				<ol>
					<li class="hero-stage relative grid grid-cols-[1.25rem_1fr] gap-4 pb-9">
						<div class="relative flex justify-center" aria-hidden="true">
							<span
								class="hero-marker z-10 mt-1 size-3 rounded-full border-2 border-diagnose bg-field"
							></span>
							<span class="absolute top-4 bottom-[-0.55rem] w-px bg-rule">
								<span class="hero-segment absolute inset-0 origin-top bg-diagnose"></span>
							</span>
						</div>
						<div>
							<p class="text-xs font-semibold tracking-[0.12em] text-diagnose uppercase">Find</p>
							<p class="mt-2 leading-relaxed text-muted">
								Look past the requested output to the person and constraint behind it.
							</p>
						</div>
					</li>
					<li class="hero-stage relative grid grid-cols-[1.25rem_1fr] gap-4 pb-9">
						<div class="relative flex justify-center" aria-hidden="true">
							<span class="hero-marker z-10 mt-1 size-3 rounded-full border-2 border-build bg-field"
							></span>
							<span class="absolute top-4 bottom-[-0.55rem] w-px bg-rule">
								<span class="hero-segment absolute inset-0 origin-top bg-build"></span>
							</span>
						</div>
						<div>
							<p class="text-xs font-semibold tracking-[0.12em] text-build uppercase">Build</p>
							<p class="mt-2 leading-relaxed text-muted">
								Follow the answer through every layer it requires.
							</p>
						</div>
					</li>
					<li class="hero-stage relative grid grid-cols-[1.25rem_1fr] gap-4">
						<div class="relative flex justify-center" aria-hidden="true">
							<span class="hero-marker z-10 mt-1 size-3 rounded-full border-2 border-proof bg-field"
							></span>
						</div>
						<div>
							<p class="text-xs font-semibold tracking-[0.12em] text-proof uppercase">Prove</p>
							<p class="mt-2 leading-relaxed text-muted">
								Show what became clearer, faster, or easier to own.
							</p>
						</div>
					</li>
				</ol>
			</aside>
		</div>

		<ul
			class="mt-16 grid gap-4 border-t border-rule pt-5 font-utility text-[0.68rem] tracking-[0.08em] text-muted uppercase sm:grid-cols-3"
			aria-label="Selected outcomes"
		>
			<li><strong class="font-medium text-ink">3,500+</strong> pages migrated</li>
			<li><strong class="font-medium text-ink">3 systems</strong> unified</li>
			<li><strong class="font-medium text-ink">Visual QA</strong> automated</li>
		</ul>
	</section>

	<section id="work" aria-labelledby="work-title" class="border-t border-rule">
		<div class="mx-auto max-w-[80rem] px-5 sm:px-8 lg:px-10">
			<div class="grid gap-6 py-16 sm:py-20 lg:grid-cols-12 lg:py-24">
				<div class="lg:col-span-7">
					<p class="mb-4 text-xs font-semibold tracking-[0.14em] text-build uppercase">
						Selected work
					</p>
					<h2
						id="work-title"
						class="max-w-[12ch] font-display text-5xl leading-[0.95] sm:text-6xl lg:text-7xl"
					>
						The work starts before the code.
					</h2>
				</div>
				<p
					class="max-w-xl self-end text-lg leading-relaxed text-muted lg:col-span-4 lg:col-start-9"
				>
					The brief is the visible request. These projects show what it became after I looked
					closer.
				</p>
			</div>

			{#each projects as project, index (project.slug)}
				<ProjectStory {project} {index} />
			{/each}
		</div>
	</section>

	<section id="approach" aria-labelledby="approach-title" class="border-t border-rule bg-surface">
		<div class="mx-auto max-w-[80rem] px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-28">
			<div class="grid gap-14 lg:grid-cols-12 lg:gap-8">
				<div class="lg:col-span-5">
					<p class="mb-4 text-xs font-semibold tracking-[0.14em] text-diagnose uppercase">
						Approach
					</p>
					<h2
						id="approach-title"
						class="max-w-[11ch] font-display text-5xl leading-[0.95] sm:text-6xl"
					>
						I came to engineering through communication design.
					</h2>
					<p class="mt-7 max-w-xl text-lg leading-relaxed text-muted">
						That background taught me to look beneath the requested deliverable. Engineering gave me
						the range to carry the answer through code, testing, and production.
					</p>
				</div>

				<div class="lg:col-span-6 lg:col-start-7">
					<ol class="border-t border-rule">
						{#each principles as principle, index (principle.title)}
							<li class="grid gap-3 border-b border-rule py-6 sm:grid-cols-[2rem_1fr]">
								<span
									class={[
										'font-utility text-xs',
										index === 0 && 'text-diagnose',
										index === 1 && 'text-build',
										index === 2 && 'text-proof'
									]}
								>
									{String(index + 1).padStart(2, '0')}
								</span>
								<div>
									<h3 class="text-lg font-semibold">{principle.title}</h3>
									<p class="mt-2 leading-relaxed text-muted">{principle.text}</p>
								</div>
							</li>
						{/each}
					</ol>
				</div>
			</div>

			<div class="mt-20 grid gap-10 border-t border-rule pt-10 lg:grid-cols-12">
				<div class="lg:col-span-3">
					<p class="text-xs font-semibold tracking-[0.14em] text-build uppercase">
						Where I have done it
					</p>
				</div>
				<div class="lg:col-span-8 lg:col-start-5">
					<div class="divide-y divide-rule border-y border-rule">
						{#each experience as item (item.company)}
							<article class="grid gap-3 py-6 sm:grid-cols-[7rem_1fr]">
								<p class="font-utility text-xs text-muted">{item.period}</p>
								<div>
									<h3 class="font-semibold">{item.company} · {item.role}</h3>
									<p class="mt-2 max-w-2xl leading-relaxed text-muted">{item.summary}</p>
								</div>
							</article>
						{/each}
					</div>
					<p class="mt-7 max-w-2xl leading-relaxed text-muted">
						BFA, Communication Design at The New School. Full Stack Web Development at Columbia
						University.
					</p>
				</div>
			</div>
		</div>
	</section>

	<section id="contact" aria-labelledby="contact-title" class="bg-ink text-field">
		<div class="mx-auto max-w-[80rem] px-5 py-16 sm:px-8 sm:py-24 lg:px-10 lg:py-32">
			<p class="mb-5 text-xs font-semibold tracking-[0.14em] text-proof-light uppercase">
				Open to the next problem
			</p>
			<h2
				id="contact-title"
				class="max-w-[17ch] font-display text-5xl leading-[0.96] sm:text-6xl lg:text-7xl"
			>
				Looking for someone who can understand the product and build the system behind it?
			</h2>
			<p class="mt-7 max-w-2xl text-lg leading-relaxed text-field/70">
				I am available for full-time engineering roles. Based in New York City and open to remote
				opportunities.
			</p>
			<a
				href={'mailto:' + contact.email}
				class="mt-10 inline-flex min-h-11 items-center gap-3 rounded-control bg-field px-5 py-3 text-sm font-semibold text-ink transition-colors hover:bg-proof hover:text-field"
			>
				Email Hugo <span aria-hidden="true">↗</span>
			</a>
		</div>
	</section>
</main>

<footer class="border-t border-field/15 bg-ink text-field">
	<div
		class="mx-auto flex max-w-[80rem] flex-col gap-6 px-5 py-8 text-sm text-field/65 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10"
	>
		<p>Built with SvelteKit, TypeScript, and attention to detail.</p>
		<nav aria-label="Elsewhere" class="flex flex-wrap items-center gap-6">
			<a
				href={contact.github}
				target="_blank"
				rel="noreferrer"
				aria-label="Hugo Hsi on GitHub"
				class="inline-flex min-h-11 items-center gap-2 transition-colors hover:text-field"
			>
				<BrandIcon name="github" size={16} />
				GitHub
			</a>
			<a
				href={contact.linkedin}
				target="_blank"
				rel="noreferrer"
				aria-label="Hugo Hsi on LinkedIn"
				class="inline-flex min-h-11 items-center gap-2 transition-colors hover:text-field"
			>
				<BrandIcon name="linkedin" size={16} />
				LinkedIn
			</a>
			<a
				href={contact.resume}
				target="_blank"
				rel="noreferrer"
				class="inline-flex min-h-11 items-center transition-colors hover:text-field"
			>
				Résumé
			</a>
		</nav>
	</div>
</footer>

<style>
	.hero-segment {
		transform: scaleY(0);
		animation: draw-trace 360ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
	}

	.hero-stage:nth-child(2) .hero-segment {
		animation-delay: 300ms;
	}

	.hero-marker {
		opacity: 0;
		transform: scale(0.65);
		animation: resolve-marker 240ms ease-out forwards;
	}

	.hero-stage:nth-child(1) .hero-marker {
		animation-delay: 80ms;
	}

	.hero-stage:nth-child(2) .hero-marker {
		animation-delay: 360ms;
	}

	.hero-stage:nth-child(3) .hero-marker {
		animation-delay: 680ms;
	}

	@keyframes draw-trace {
		to {
			transform: scaleY(1);
		}
	}

	@keyframes resolve-marker {
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.hero-segment {
			transform: scaleY(1);
		}

		.hero-marker {
			opacity: 1;
			transform: scale(1);
		}
	}
</style>
