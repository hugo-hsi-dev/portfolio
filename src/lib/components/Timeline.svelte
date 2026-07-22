<script lang="ts">
	import type { DatePrecision } from '$lib/server/content';
	import Reveal from './Reveal.svelte';
	import SectionHeader from './SectionHeader.svelte';

	type TimelineItem = {
		slug: string;
		title: string;
		subtitle: string;
		startDate?: string;
		startDatePrecision?: DatePrecision;
		endDate?: string;
		endDatePrecision?: DatePrecision;
		completionDate?: string;
		datePrecision?: DatePrecision;
		isCurrent?: boolean;
		html?: string;
	};

	let {
		title,
		items,
		topBorder = false
	}: { title: string; items: TimelineItem[]; topBorder?: boolean } = $props();

	function formatDate(date: string, precision: DatePrecision = 'year') {
		const parsed = new Date(`${date}T00:00:00.000Z`);

		return precision === 'month'
			? new Intl.DateTimeFormat('en-US', {
					month: 'short',
					year: 'numeric',
					timeZone: 'UTC'
				}).format(parsed)
			: String(parsed.getUTCFullYear());
	}

	function formatItemDate(item: TimelineItem) {
		if (item.completionDate) return formatDate(item.completionDate, item.datePrecision);
		if (!item.startDate) return '';

		const start = formatDate(item.startDate, item.startDatePrecision);
		if (item.isCurrent) return `${start} - Present`;
		if (item.endDate) return `${start} - ${formatDate(item.endDate, item.endDatePrecision)}`;
		return start;
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
				<Reveal delay={Math.min(index * 80, 240)}>
					<article>
						<span class="marker" aria-hidden="true"></span>
						<p class="date">{formatItemDate(item)}</p>
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

	.description :global(ul) {
		display: grid;
		max-width: 44rem;
		gap: 0.75rem;
		margin: 1rem 0 0;
		padding-inline-start: 1.25rem;
		color: var(--color-stone-light);
		line-height: 1.7;
	}

	.description :global(li) {
		padding-inline-start: 0.25rem;
	}

	@media (min-width: 64rem) {
		h3 {
			font-size: 2rem;
		}
	}
</style>
