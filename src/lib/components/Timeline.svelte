<script lang="ts">
	import Reveal from './Reveal.svelte';
	import SectionHeader from './SectionHeader.svelte';

	type TimelineItem = {
		slug: string;
		title: string;
		subtitle: string;
		startDate: string;
		endDate?: string;
		isCurrent?: boolean;
		html?: string;
	};

	let {
		title,
		items,
		topBorder = false
	}: { title: string; items: TimelineItem[]; topBorder?: boolean } = $props();

	function year(date?: string) {
		return date ? new Date(`${date}T00:00:00.000Z`).getUTCFullYear() : 'Present';
	}

	let headingId = $derived(`${title.toLowerCase().replaceAll(' ', '-')}-title`);
</script>

<section
	class={['timeline-section', topBorder && 'timeline-section--border']}
	aria-labelledby={headingId}
>
	<div class="section-container">
		<Reveal>
			<SectionHeader
				{title}
				id={headingId}
				meta={`${items.length} ${items.length === 1 ? 'item' : 'items'}`}
			/>
		</Reveal>

		<div class="timeline-list">
			{#each items as item, index (item.slug)}
				<Reveal delay={index * 90}>
					<article>
						<span class="marker" aria-hidden="true"></span>
						<p class="date">
							{year(item.startDate)} - {item.isCurrent ? 'Present' : year(item.endDate)}
						</p>
						<h3>{item.title}</h3>
						<p class="subtitle">{item.subtitle}</p>
						{#if item.html}
							<div class="description">{@html item.html}</div>
						{/if}
					</article>
				</Reveal>
			{/each}
		</div>
	</div>
</section>

<style>
	.timeline-section {
		background: var(--color-charcoal);
		color: var(--color-cream);
		padding: var(--section-space) var(--page-gutter);
	}

	.timeline-section--border {
		border-top: 1px solid var(--color-border);
	}

	.section-container {
		width: min(100%, var(--content-width));
		margin-inline: auto;
	}

	.timeline-list {
		position: relative;
		display: grid;
		gap: 4rem;
		border-left: 1px solid var(--color-border);
		padding-inline-start: 3rem;
	}

	article {
		position: relative;
	}

	.marker {
		position: absolute;
		top: 0.5rem;
		left: calc(-3rem - 2px);
		width: 3px;
		height: 3px;
		background: var(--color-stone);
	}

	.date {
		margin: 0 0 0.5rem;
		color: var(--color-stone);
		font-size: 0.75rem;
		font-weight: 500;
		text-transform: uppercase;
	}

	h3 {
		margin: 0 0 0.25rem;
		font-family: var(--font-serif);
		font-size: 1.75rem;
		font-weight: 400;
		line-height: 1.15;
	}

	.subtitle {
		margin: 0;
		color: var(--color-gold);
	}

	.description :global(p) {
		max-width: 44rem;
		margin: 0.75rem 0 0;
		color: var(--color-stone-light);
		line-height: 1.7;
	}

	@media (min-width: 64rem) {
		h3 {
			font-size: 2rem;
		}
	}
</style>
