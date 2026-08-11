<script lang="ts">
	import type { EducationCanvasFrame } from '$lib/features/portfolio-content';
	import { formatPortfolioDate } from '$lib/features/portfolio-content/date';

	let { frame }: { frame: EducationCanvasFrame } = $props();
</script>

<section class="education-frame">
	<div class="frame-eyebrow">Education</div>
	<div class="education-copy">
		<span
			>{formatPortfolioDate(
				frame.education.metadata.completionDate,
				frame.education.metadata.datePrecision
			)}</span
		>
		<h2>{frame.education.metadata.institution}</h2>
		<p>{frame.education.metadata.degree}</p>
	</div>
</section>

<style>
	.education-frame {
		display: flex;
		height: 100%;
		flex-direction: column;
		padding: 42px 48px;
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
	.education-copy {
		max-width: 500px;
		margin-top: auto;
		padding-top: 23px;
		border-top: 1px solid #dcdcd7;
	}
	.education-copy > span {
		color: #73736e;
		font-size: 11px;
		font-weight: 500;
		letter-spacing: 0.045em;
		text-transform: uppercase;
	}
	.education-frame h2 {
		margin: 8px 0 7px;
		font-family: var(--font-serif);
		font-size: 38px;
		font-weight: 400;
		letter-spacing: -0.02em;
		line-height: 1.04;
	}
	.education-copy > p {
		margin: 0;
		color: #54544f;
		font-size: 14px;
		line-height: 1.45;
	}
</style>
