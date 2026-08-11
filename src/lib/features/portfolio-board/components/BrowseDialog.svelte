<script lang="ts">
	import { ExternalLink, X } from '@lucide/svelte';
	import { Dialog } from 'bits-ui';

	import type { PortfolioContent } from '$lib/features/portfolio-content';
	import { formatPortfolioDate } from '$lib/features/portfolio-content/date';

	import type { PortfolioBoardController } from '../board-controller.svelte';

	let { content, controller }: { content: PortfolioContent; controller: PortfolioBoardController } =
		$props();

	const technologyCategories = [
		{ key: 'frontend', label: 'Frontend' },
		{ key: 'backend', label: 'Backend' },
		{ key: 'database', label: 'Database' },
		{ key: 'tools', label: 'Tools' }
	] as const;

	function experienceRange(item: PortfolioContent['experience'][number]): string {
		const start = formatPortfolioDate(item.metadata.startDate, item.metadata.startDatePrecision);
		if (item.metadata.isCurrent) return `${start} — Present`;
		return item.metadata.endDate
			? `${start} — ${formatPortfolioDate(item.metadata.endDate, item.metadata.endDatePrecision)}`
			: start;
	}

	function projectContext(item: PortfolioContent['projects'][number]): string {
		return item.metadata.context === 'work'
			? (item.metadata.company ?? 'Client work')
			: 'Personal project';
	}
</script>

{#if controller.browseOpen}
	<Dialog.Root open onOpenChange={(open) => (controller.browseOpen = open)}>
		<Dialog.Portal>
			<Dialog.Overlay class="dialog-overlay" />
			<Dialog.Content
				class="browse-dialog"
				aria-describedby="browse-description"
				data-browse-document
			>
				<header class="dialog-heading">
					<div>
						<p class="file-context">Hugo Hsi / Portfolio</p>
						<Dialog.Title>Browse portfolio</Dialog.Title>
						<Dialog.Description id="browse-description">
							The same work, arranged for reading.
						</Dialog.Description>
					</div>
					<Dialog.Close class="dialog-close" aria-label="Close browse mode">
						<X size={19} />
					</Dialog.Close>
				</header>

				<div class="browse-content">
					<section class="profile-section" aria-labelledby="browse-profile-title">
						<p class="browse-label">Profile</p>
						<h2 id="browse-profile-title">
							{content.site.metadata.hero.firstName}
							{content.site.metadata.hero.lastName}
						</h2>
						<p class="profile-tagline">{content.site.metadata.hero.tagline}</p>
						{#if content.site.metadata.hero.intro}
							<p class="profile-intro">{content.site.metadata.hero.intro}</p>
						{/if}
						<div class="profile-actions">
							<a class="primary-action" href="#browse-projects"
								>{content.site.metadata.hero.ctaPrimary.text}</a
							>
							{#if content.site.metadata.resumeUrl}
								<a href={content.site.metadata.resumeUrl} target="_blank" rel="noopener noreferrer"
									>{content.site.metadata.hero.ctaSecondary?.text ?? 'View resume'}
									<ExternalLink size={13} /></a
								>
							{/if}
						</div>
						{#if content.site.metadata.hero.quote}
							<blockquote>{content.site.metadata.hero.quote}</blockquote>
						{/if}
					</section>

					<section id="browse-projects" aria-labelledby="browse-projects-title">
						<p class="browse-label">Selected work</p>
						<h2 class="section-title" id="browse-projects-title">Projects</h2>
						<div class="project-list">
							{#each content.projects as project, index (project.slug)}
								<article
									class="project-entry"
									class:project-entry--text={!project.metadata.featuredImage}
								>
									{#if project.metadata.featuredImage}
										<img
											src={project.metadata.featuredImage}
											alt={project.metadata.featuredImageAlt ?? ''}
											loading="lazy"
										/>
									{/if}
									<div class="project-entry__copy">
										<div class="entry-meta">
											<span>{projectContext(project)}</span>
											<span>{String(index + 1).padStart(2, '0')}</span>
										</div>
										<h3>{project.metadata.title}</h3>
										<p>{project.metadata.excerpt}</p>
										<ul
											class="technology-list"
											aria-label={`${project.metadata.title} technologies`}
										>
											{#each project.metadata.technologies as technology (technology)}
												<li>{technology}</li>
											{/each}
										</ul>
										{#if project.metadata.liveUrl}
											<a
												class="text-link"
												href={project.metadata.liveUrl}
												target="_blank"
												rel="noopener noreferrer">Visit project <ExternalLink size={13} /></a
											>
										{/if}
									</div>
								</article>
							{/each}
						</div>
					</section>

					<section aria-labelledby="browse-experience-title">
						<p class="browse-label">Practice</p>
						<h2 class="section-title" id="browse-experience-title">Experience</h2>
						<div class="story-list">
							{#each content.experience as item (item.slug)}
								<article class="story-entry">
									<p class="story-date">{experienceRange(item)}</p>
									<h3>{item.metadata.role}</h3>
									<p class="story-place">{item.metadata.company}</p>
									<ul class="rich-copy">
										{#each item.metadata.highlights as bullet (bullet)}<li>{bullet}</li>{/each}
									</ul>
								</article>
							{/each}
						</div>
					</section>

					<section aria-labelledby="browse-education-title">
						<p class="browse-label">Education</p>
						<h2 class="section-title" id="browse-education-title">Learning</h2>
						<div class="education-list">
							{#each content.education as item (item.slug)}
								<article>
									<p class="story-date">
										{formatPortfolioDate(item.metadata.completionDate, item.metadata.datePrecision)}
									</p>
									<h3>{item.metadata.institution}</h3>
									<p>{item.metadata.degree}</p>
								</article>
							{/each}
						</div>
					</section>

					<section aria-labelledby="browse-technologies-title">
						<p class="browse-label">Toolkit</p>
						<h2 class="section-title" id="browse-technologies-title">Technologies</h2>
						<div class="technology-groups">
							{#each technologyCategories as category (category.key)}
								<article>
									<h3>{category.label}</h3>
									<ul>
										{#each content.technologies.metadata[category.key] as technology (technology)}
											<li>{technology}</li>
										{/each}
									</ul>
								</article>
							{/each}
						</div>
					</section>

					<section class="contact-section" aria-labelledby="browse-contact-title">
						<p class="browse-label">Contact</p>
						<h2 id="browse-contact-title">{content.site.metadata.footer.heading}</h2>
						<p>{content.site.metadata.footer.intro}</p>
						<a class="email-link" href={`mailto:${content.site.metadata.contact.email}`}
							>{content.site.metadata.contact.email}</a
						>
						<div class="browse-contact-links">
							{#if content.site.metadata.contact.github}
								<a
									href={content.site.metadata.contact.github}
									target="_blank"
									rel="noopener noreferrer">GitHub <ExternalLink size={13} /></a
								>
							{/if}
							{#if content.site.metadata.contact.linkedin}
								<a
									href={content.site.metadata.contact.linkedin}
									target="_blank"
									rel="noopener noreferrer">LinkedIn <ExternalLink size={13} /></a
								>
							{/if}
							{#if content.site.metadata.resumeUrl}
								<a href={content.site.metadata.resumeUrl} target="_blank" rel="noopener noreferrer"
									>Resume <ExternalLink size={13} /></a
								>
							{/if}
						</div>
						<p class="built-with">{content.site.metadata.footer.builtWith}</p>
					</section>
				</div>
			</Dialog.Content>
		</Dialog.Portal>
	</Dialog.Root>
{/if}

<style>
	:global(.dialog-overlay) {
		position: fixed;
		z-index: 150;
		inset: 0;
		background: rgb(24 24 24 / 52%);
		backdrop-filter: blur(2px);
	}
	:global(.browse-dialog) {
		position: fixed;
		z-index: 160;
		top: 50%;
		left: 50%;
		display: flex;
		width: min(900px, calc(100vw - 32px));
		max-height: min(820px, calc(100dvh - 36px));
		flex-direction: column;
		border: 1px solid #d7d7d7;
		border-radius: 8px;
		overflow: hidden;
		background: #fbfbf8;
		color: #242424;
		box-shadow: 0 24px 80px rgb(0 0 0 / 28%);
		transform: translate(-50%, -50%);
	}
	.dialog-heading {
		display: flex;
		flex: 0 0 auto;
		align-items: flex-start;
		justify-content: space-between;
		padding: 22px 28px 18px;
		border-bottom: 1px solid #deded9;
		background: rgb(251 251 248 / 96%);
	}
	.file-context {
		margin: 0 0 5px;
		color: #62625d;
		font-size: 10px;
		letter-spacing: 0.04em;
	}
	.dialog-heading :global(h2) {
		margin: 0;
		font-size: 17px;
		letter-spacing: -0.01em;
	}
	.dialog-heading :global([data-description]) {
		margin: 5px 0 0;
		color: #6f6f6b;
		font-size: 12px;
	}
	:global(.dialog-close) {
		display: grid;
		width: 36px;
		height: 36px;
		border: 1px solid transparent;
		place-items: center;
		border-radius: 5px;
		background: transparent;
		color: #565656;
	}
	:global(.dialog-close:hover) {
		background: #ededeb;
	}
	:global(.dialog-close:focus-visible) {
		border-color: var(--figma-blue);
		outline: 2px solid var(--figma-blue);
		outline-offset: 1px;
	}
	.browse-content {
		min-height: 0;
		flex: 1 1 auto;
		padding: 0 44px 44px;
		overflow: auto;
		overscroll-behavior: contain;
		scroll-behavior: smooth;
	}
	.browse-content section {
		padding: 46px 0;
		border-bottom: 1px solid #deded9;
	}
	.browse-content section:last-child {
		border: 0;
	}
	.browse-label {
		margin: 0 0 18px !important;
		color: #62625d !important;
		font-size: 10px !important;
		font-weight: 600;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}
	.profile-section h2,
	.contact-section h2 {
		margin: 0;
		font-family: var(--font-serif);
		font-size: clamp(46px, 8vw, 78px);
		font-weight: 400;
		letter-spacing: -0.04em;
		line-height: 0.95;
	}
	.profile-tagline {
		max-width: 650px;
		margin: 22px 0 0;
		font-size: 22px;
		font-weight: 500;
		letter-spacing: -0.02em;
		line-height: 1.3;
	}
	.profile-intro,
	.contact-section > p {
		max-width: 620px;
		margin: 14px 0 0;
		color: #60605c;
		font-size: 15px;
		line-height: 1.65;
	}
	.profile-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 18px;
		align-items: center;
		margin-top: 24px;
	}
	.profile-actions a,
	.text-link,
	.browse-contact-links a {
		display: inline-flex;
		min-height: 36px;
		align-items: center;
		gap: 5px;
		color: #096cae;
		font-size: 13px;
		font-weight: 600;
		text-decoration-thickness: 1px;
		text-underline-offset: 3px;
	}
	.profile-actions .primary-action {
		padding: 0 15px;
		background: #242424;
		color: white;
		text-decoration: none;
	}
	.browse-content blockquote {
		max-width: 620px;
		margin: 34px 0 0;
		padding-left: 18px;
		border-left: 2px solid #c9c9c2;
		color: #4c4c48;
		font-family: var(--font-serif);
		font-size: 21px;
		line-height: 1.45;
	}
	.section-title {
		margin: 0;
		font-family: var(--font-serif);
		font-size: 42px;
		font-weight: 400;
		letter-spacing: -0.025em;
	}
	.project-list,
	.story-list {
		margin-top: 28px;
	}
	.project-entry {
		display: grid;
		grid-template-columns: minmax(0, 1.08fr) minmax(260px, 0.92fr);
		gap: 28px;
		padding: 28px 0;
		border-top: 1px solid #deded9;
	}
	.project-entry--text {
		grid-template-columns: minmax(0, 650px);
	}
	.project-entry img {
		width: 100%;
		aspect-ratio: 16 / 9;
		border: 1px solid rgb(0 0 0 / 8%);
		object-fit: cover;
	}
	.entry-meta {
		display: flex;
		justify-content: space-between;
		color: #63635d;
		font-size: 10px;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	.project-entry h3,
	.story-entry h3,
	.education-list h3 {
		margin: 12px 0 7px;
		font-family: var(--font-serif);
		font-size: 27px;
		font-weight: 400;
		letter-spacing: -0.02em;
		line-height: 1.05;
	}
	.project-entry__copy > p,
	.education-list article > p:last-child {
		margin: 0;
		color: #60605c;
		font-size: 14px;
		line-height: 1.55;
	}
	.technology-list,
	.technology-groups ul {
		display: flex;
		flex-wrap: wrap;
		gap: 7px 14px;
		padding: 0;
		list-style: none;
	}
	.technology-list {
		margin: 18px 0 12px;
	}
	.technology-list li {
		color: #5c5c57;
		font-size: 11px;
	}
	.story-entry {
		display: grid;
		grid-template-columns: 150px minmax(0, 1fr);
		padding: 28px 0;
		border-top: 1px solid #deded9;
	}
	.story-entry > :not(.story-date) {
		grid-column: 2;
	}
	.story-date {
		grid-row: 1 / span 4;
		margin: 4px 0 0;
		color: #62625d;
		font-size: 11px;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}
	.story-entry h3 {
		margin-top: 0;
	}
	.story-place {
		margin: 0 0 15px;
		font-size: 13px;
		font-weight: 600;
	}
	.rich-copy {
		max-width: 620px;
		margin: 0;
		padding-left: 18px;
		color: #555550;
		font-size: 13px;
		line-height: 1.55;
	}
	.rich-copy li + li {
		margin-top: 9px;
	}
	.education-list,
	.technology-groups {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0 34px;
		margin-top: 28px;
	}
	.education-list article,
	.technology-groups article {
		padding: 22px 0;
		border-top: 1px solid #deded9;
	}
	.education-list h3 {
		margin-top: 8px;
	}
	.technology-groups h3 {
		margin: 0 0 12px;
		font-size: 12px;
		letter-spacing: 0.04em;
	}
	.technology-groups ul {
		margin: 0;
	}
	.technology-groups li {
		color: #60605c;
		font-size: 13px;
	}
	.contact-section h2 {
		max-width: 540px;
		font-size: 56px;
	}
	.email-link {
		display: inline-block;
		margin-top: 28px;
		color: #242424;
		font-family: var(--font-serif);
		font-size: 30px;
		text-decoration-thickness: 1px;
		text-underline-offset: 5px;
	}
	.browse-contact-links {
		display: flex;
		flex-wrap: wrap;
		gap: 20px;
		margin-top: 22px;
	}
	.built-with {
		margin-top: 42px !important;
		font-size: 11px !important;
	}
	@media (max-width: 700px) {
		:global(.dialog-overlay) {
			background: #1e1e1e;
			backdrop-filter: none;
		}
		:global(.browse-dialog) {
			top: 0;
			left: 0;
			width: 100vw;
			height: 100dvh;
			max-height: none;
			border: 0;
			border-radius: 0;
			transform: none;
		}
		.dialog-heading {
			position: sticky;
			top: 0;
			z-index: 2;
			padding: 15px 18px 13px;
			background: rgb(251 251 248 / 97%);
		}
		.dialog-heading :global([data-description]) {
			display: none;
		}
		:global(.dialog-close) {
			width: 44px;
			height: 44px;
		}
		.browse-content {
			padding: 0 22px 36px;
			scroll-behavior: auto;
		}
		.browse-content section {
			padding: 38px 0;
		}
		.profile-section h2 {
			font-size: 58px;
		}
		.profile-tagline {
			font-size: 22px;
		}
		.profile-intro,
		.contact-section > p {
			font-size: 16px;
			line-height: 1.6;
		}
		.profile-actions {
			gap: 12px;
		}
		.profile-actions a,
		.text-link,
		.browse-contact-links a {
			min-height: 44px;
			font-size: 14px;
		}
		.profile-actions .primary-action {
			padding-inline: 16px;
		}
		.browse-content blockquote {
			font-size: 20px;
		}
		.section-title {
			font-size: 38px;
		}
		.project-entry {
			grid-template-columns: 1fr;
			gap: 20px;
			padding: 26px 0;
		}
		.project-entry h3,
		.story-entry h3,
		.education-list h3 {
			font-size: 27px;
		}
		.project-entry__copy > p,
		.education-list article > p:last-child,
		.rich-copy,
		.technology-groups li {
			font-size: 15px;
		}
		.story-entry {
			display: block;
			padding: 26px 0;
		}
		.story-date {
			margin-bottom: 12px;
			font-size: 11px;
		}
		.education-list,
		.technology-groups {
			grid-template-columns: 1fr;
		}
		.contact-section h2 {
			font-size: 44px;
		}
		.email-link {
			max-width: 100%;
			font-size: 24px;
			overflow-wrap: anywhere;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.browse-content {
			scroll-behavior: auto;
		}
	}
</style>
