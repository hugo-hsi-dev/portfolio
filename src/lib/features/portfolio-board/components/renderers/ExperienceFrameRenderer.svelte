<script lang="ts">
	import { BriefcaseBusiness } from '@lucide/svelte';

	import type { ExperienceCanvasFrame } from '$lib/features/portfolio-content';
	import { formatPortfolioDate } from '$lib/features/portfolio-content/date';

	let { frame }: { frame: ExperienceCanvasFrame } = $props();
</script>

<section class="story-frame">
	<div class="story-icon"><BriefcaseBusiness size={18} /></div>
	<div class="frame-eyebrow">Experience</div>
	<h2>{frame.experience.metadata.role}</h2>
	<p class="story-place">{frame.experience.metadata.company}</p>
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
	<ul class="rich-copy">
		{#each frame.experience.metadata.highlights as item (item)}<li>{item}</li>{/each}
	</ul>
</section>

<style>
	.story-frame {
		height: 100%;
		padding: 38px 42px;
	}
	.story-icon {
		display: grid;
		width: 36px;
		height: 36px;
		margin-bottom: 28px;
		place-items: center;
		border-radius: 8px;
		background: #292929;
		color: white;
	}
	.frame-eyebrow {
		display: flex;
		align-items: center;
		gap: 6px;
		color: #8b8b8b;
		font-size: 10px;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	.story-frame h2 {
		margin: 9px 0 3px;
		font-family: var(--font-serif);
		font-size: 33px;
		font-weight: 400;
		line-height: 1;
	}
	.story-place {
		margin: 0;
		font-size: 12px;
		font-weight: 600;
	}
	.story-date {
		margin: 4px 0 18px;
		color: #888;
		font-size: 10px;
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
