<script lang="ts">
	import { Sparkles } from '@lucide/svelte';

	import type { TechnologiesCanvasFrame } from '$lib/features/portfolio-content';

	let { frame }: { frame: TechnologiesCanvasFrame } = $props();

	const technologyCategories = [
		{ key: 'frontend', label: 'Frontend' },
		{ key: 'backend', label: 'Backend' },
		{ key: 'database', label: 'Database' },
		{ key: 'tools', label: 'Tools' }
	] as const;
</script>

<section class="skills-frame">
	<div>
		<div class="frame-eyebrow"><Sparkles size={14} /> Toolkit</div>
		<h2>Built across the stack.</h2>
		<p>Tools I use to move an idea from design file to resilient production code.</p>
	</div>
	<div class="skills-grid">
		{#each technologyCategories as category (category.key)}
			<div>
				<h3>{category.label}</h3>
				<p>{frame.technologies.metadata[category.key].join(' · ')}</p>
			</div>
		{/each}
	</div>
</section>

<style>
	.skills-frame {
		display: grid;
		height: 100%;
		grid-template-columns: 0.85fr 1.15fr;
		gap: 50px;
		padding: 48px;
		background: #202020;
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
	.skills-frame h2 {
		max-width: 240px;
		margin: 22px 0 3px;
		font-family: var(--font-serif);
		font-size: 40px;
		font-weight: 400;
		line-height: 1;
	}
	.skills-frame > div:first-child > p {
		max-width: 260px;
		color: #a5a5a5;
		font-size: 11px;
		line-height: 1.5;
	}
	.skills-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		border-top: 1px solid #424242;
		border-left: 1px solid #424242;
	}
	.skills-grid > div {
		padding: 18px;
		border-right: 1px solid #424242;
		border-bottom: 1px solid #424242;
	}
	.skills-grid h3 {
		margin: 0 0 9px;
		color: #8b8b8b;
		font-size: 9px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	.skills-grid p {
		margin: 0;
		color: #ddd;
		font-size: 10px;
		line-height: 1.55;
	}
</style>
