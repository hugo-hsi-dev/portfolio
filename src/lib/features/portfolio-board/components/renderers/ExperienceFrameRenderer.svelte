<script lang="ts">
	import type { ExperienceCanvasFrame } from '$lib/features/portfolio-content';
	import { formatPortfolioDate } from '$lib/features/portfolio-content/date';

	let { frame }: { frame: ExperienceCanvasFrame } = $props();
</script>

<section class="story-frame">
	<div class="frame-eyebrow">Experience</div>
	<header>
		<p class="story-date">
			{formatPortfolioDate(
				frame.experience.metadata.startDate,
				frame.experience.metadata.startDatePrecision
			)} — {frame.experience.metadata.isCurrent
				? 'Present'
				: frame.experience.metadata.endDate
					? formatPortfolioDate(
							frame.experience.metadata.endDate,
							frame.experience.metadata.endDatePrecision
						)
					: ''}
		</p>
		<h2>{frame.experience.metadata.role}</h2>
		<p class="story-place">{frame.experience.metadata.company}</p>
	</header>
	<ul class="rich-copy">
		{#each frame.experience.metadata.highlights as item (item)}<li>{item}</li>{/each}
	</ul>
</section>

<style>
	.story-frame {
		height: 100%;
		padding: 46px 52px;
		background: #fafaf8;
		color: #20201e;
	}
	.frame-eyebrow {
		color: #6f6f6a;
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	.story-frame header {
		max-width: 590px;
		margin-top: 36px;
		padding-bottom: 22px;
		border-bottom: 1px solid #dcdcd7;
	}
	.story-frame h2 {
		margin: 8px 0 6px;
		font-family: var(--font-serif);
		font-size: 38px;
		font-weight: 400;
		letter-spacing: -0.02em;
		line-height: 1.04;
	}
	.story-place {
		margin: 0;
		font-size: 14px;
		font-weight: 600;
	}
	.story-date {
		margin: 0;
		color: #73736e;
		font-size: 11px;
		font-weight: 500;
		letter-spacing: 0.045em;
		text-transform: uppercase;
	}
	.rich-copy {
		max-width: 590px;
		margin: 24px 0 0;
		padding-left: 19px;
		color: #54544f;
		font-size: 14px;
		line-height: 1.5;
		list-style: disc;
	}
	.rich-copy li {
		padding-left: 5px;
		margin-bottom: 11px;
	}
	.rich-copy li::marker {
		color: #20201e;
	}
</style>
