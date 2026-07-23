<script lang="ts">
	import { ExternalLink, X } from '@lucide/svelte';
	import { Dialog } from 'bits-ui';

	import type { PortfolioContent } from '$lib/features/portfolio-content';

	import type { PortfolioBoardController } from '../board-controller.svelte';

	let { content, controller }: { content: PortfolioContent; controller: PortfolioBoardController } =
		$props();

	const technologyCategories = [
		{ key: 'frontend', label: 'Frontend' },
		{ key: 'backend', label: 'Backend' },
		{ key: 'database', label: 'Database' },
		{ key: 'tools', label: 'Tools' }
	] as const;
</script>

<Dialog.Root bind:open={controller.browseOpen}>
	<Dialog.Portal>
		<Dialog.Overlay class="dialog-overlay" />
		<Dialog.Content class="browse-dialog" aria-describedby="browse-description">
			<div class="dialog-heading">
				<div>
					<Dialog.Title>Browse portfolio</Dialog.Title>
					<Dialog.Description id="browse-description">
						The same portfolio, arranged for reading.
					</Dialog.Description>
				</div>
				<Dialog.Close class="dialog-close" aria-label="Close browse mode">
					<X size={18} />
				</Dialog.Close>
			</div>
			<div class="browse-content">
				<section>
					<p class="browse-label">Profile</p>
					<h2>{content.site.metadata.hero.firstName} {content.site.metadata.hero.lastName}</h2>
					{#if content.site.metadata.hero.intro}<p>{content.site.metadata.hero.intro}</p>{/if}
					{#if content.site.metadata.hero.quote}
						<blockquote>{content.site.metadata.hero.quote}</blockquote>
					{/if}
				</section>
				<section>
					<p class="browse-label">Projects</p>
					{#each content.projects as project (project.slug)}
						<article>
							<h3>{project.metadata.title}</h3>
							<p>{project.metadata.excerpt}</p>
							{#if project.metadata.liveUrl}<a
									href={project.metadata.liveUrl}
									target="_blank"
									rel="noopener noreferrer">Visit project <ExternalLink size={13} /></a
								>{/if}
						</article>
					{/each}
				</section>
				<section>
					<p class="browse-label">Experience</p>
					{#each content.experience as item (item.slug)}
						<article>
							<h3>{item.metadata.role}</h3>
							<p class="browse-subtitle">{item.metadata.company}</p>
							<ul class="rich-copy">
								{#each item.metadata.highlights as bullet (bullet)}<li>{bullet}</li>{/each}
							</ul>
						</article>
					{/each}
				</section>
				<section>
					<p class="browse-label">Education</p>
					{#each content.education as item (item.slug)}
						<article>
							<h3>{item.metadata.institution}</h3>
							<p>{item.metadata.degree}</p>
						</article>
					{/each}
				</section>
				<section>
					<p class="browse-label">Technologies</p>
					<h2>Built across the stack.</h2>
					{#each technologyCategories as category (category.key)}
						<article>
							<h3>{category.label}</h3>
							<p>{content.technologies.metadata[category.key].join(' · ')}</p>
						</article>
					{/each}
				</section>
				<section>
					<p class="browse-label">Contact</p>
					<h2>{content.site.metadata.footer.heading}</h2>
					<a href={`mailto:${content.site.metadata.contact.email}`}
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
					<p>{content.site.metadata.footer.builtWith}</p>
				</section>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

<style>
	:global(.dialog-overlay) {
		position: fixed;
		z-index: 150;
		inset: 0;
		background: rgb(0 0 0 / 45%);
		backdrop-filter: blur(2px);
	}
	:global(.browse-dialog) {
		position: fixed;
		z-index: 160;
		top: 50%;
		left: 50%;
		width: min(760px, calc(100vw - 28px));
		max-height: min(760px, calc(100dvh - 40px));
		border: 0;
		border-radius: 7px;
		overflow: hidden;
		background: white;
		color: #292929;
		box-shadow: 0 18px 60px rgb(0 0 0 / 25%);
		transform: translate(-50%, -50%);
	}
	.dialog-heading {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		padding: 24px 28px 18px;
		border-bottom: 1px solid #e2e2e2;
	}
	.dialog-heading :global(h2) {
		margin: 0;
		font-size: 16px;
	}
	.dialog-heading :global(p) {
		margin: 8px 0 0;
		color: #6b6b6b;
		font-size: 12px;
		line-height: 1.5;
	}
	:global(.dialog-close) {
		display: grid;
		width: 30px;
		height: 30px;
		border: 0;
		place-items: center;
		border-radius: 4px;
		background: #eee;
		color: #555;
	}
	.browse-content {
		max-height: calc(100dvh - 150px);
		padding: 0 28px 40px;
		overflow: auto;
	}
	.browse-content section {
		padding: 26px 0;
		border-bottom: 1px solid #e4e4e4;
	}
	.browse-content section:last-child {
		border: 0;
	}
	.browse-label {
		margin: 0 0 14px !important;
		color: #666 !important;
		font-size: 9px !important;
		font-weight: 600;
		letter-spacing: 0.09em;
		text-transform: uppercase;
	}
	.browse-content h2 {
		font-family: var(--font-serif);
		font-size: 32px;
		font-weight: 400;
	}
	.browse-content h3 {
		margin: 0 0 5px;
		font-size: 14px;
	}
	.browse-content p {
		max-width: 620px;
		color: #666;
		font-size: 12px;
		line-height: 1.5;
	}
	.browse-content blockquote {
		max-width: 620px;
		margin: 18px 0 0;
		padding-left: 14px;
		border-left: 2px solid #d5d5d5;
		color: #555;
		font-family: var(--font-serif);
		font-size: 18px;
		line-height: 1.35;
	}
	.browse-content article {
		margin-top: 22px;
	}
	.browse-content a {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		color: #0878c8;
		font-size: 11px;
		font-weight: 600;
	}
	.browse-contact-links {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		margin-top: 14px;
	}
	.browse-subtitle {
		margin: 0 0 10px !important;
		color: #333 !important;
		font-weight: 600;
	}
	.rich-copy {
		color: #5f5f5f;
		font-size: 10px;
		line-height: 1.45;
	}
	.rich-copy li {
		margin-bottom: 7px;
	}
</style>
