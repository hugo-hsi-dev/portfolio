<script lang="ts">
	import { GraduationCap } from '@lucide/svelte';

	import type { EducationCanvasFrame } from '$lib/features/portfolio-content';
	import { formatPortfolioDate } from '$lib/features/portfolio-content/date';

	let { frame }: { frame: EducationCanvasFrame } = $props();
</script>

<section class="education-frame">
	<div class="story-icon story-icon--blue"><GraduationCap size={19} /></div>
	<div class="frame-eyebrow">Education</div>
	<h2>{frame.education.metadata.institution}</h2>
	<p>{frame.education.metadata.degree}</p>
	<span
		>{formatPortfolioDate(
			frame.education.metadata.completionDate,
			frame.education.metadata.datePrecision
		)}</span
	>
</section>

<style>
	.education-frame {
		display: flex;
		height: 100%;
		flex-direction: column;
		padding: 34px 38px;
		background: #f8f8f6;
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
	.story-icon--blue {
		margin-bottom: auto;
		background: #dceeff;
		color: #1678bd;
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
	.education-frame h2 {
		margin: 9px 0 3px;
		font-family: var(--font-serif);
		font-size: 33px;
		font-weight: 400;
		line-height: 1;
	}
	.education-frame > p {
		margin: 5px 0;
		color: #555;
		font-size: 11px;
	}
	.education-frame > span {
		margin-top: 5px;
		color: #888;
		font-size: 10px;
	}
</style>
