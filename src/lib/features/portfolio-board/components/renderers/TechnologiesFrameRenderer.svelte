<script lang="ts">
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
		<div class="frame-eyebrow">Toolkit</div>
		<h2>Built across the stack.</h2>
		<p>Tools I use to move an idea from design file to resilient production code.</p>
	</div>
	<div class="skills-grid">
		{#each technologyCategories as category (category.key)}
			<section>
				<h3>{category.label}</h3>
				<ul>
					{#each frame.technologies.metadata[category.key] as technology (technology)}
						<li>{technology}</li>
					{/each}
				</ul>
			</section>
		{/each}
	</div>
</section>

<style>
	.skills-frame {
		display: grid;
		height: 100%;
		grid-template-columns: 0.7fr 1.3fr;
		gap: 88px;
		padding: 58px 64px;
		background: #fafaf8;
		color: #20201e;
	}
	.frame-eyebrow {
		display: flex;
		align-items: center;
		gap: 6px;
		color: #8b8b8b;
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	.skills-frame h2 {
		max-width: 360px;
		margin: 40px 0 12px;
		font-family: var(--font-serif);
		font-size: 50px;
		font-weight: 400;
		letter-spacing: -0.025em;
		line-height: 0.98;
	}
	.skills-frame > div:first-child > p {
		max-width: 340px;
		margin: 0;
		color: #62625d;
		font-size: 14px;
		line-height: 1.5;
	}
	.skills-grid {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 34px;
		align-content: center;
	}
	.skills-grid section {
		min-width: 0;
	}
	.skills-grid h3 {
		margin: 0 0 16px;
		padding-bottom: 10px;
		border-bottom: 1px solid #dcdcd7;
		color: #73736e;
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.075em;
		text-transform: uppercase;
	}
	.skills-grid ul {
		margin: 0;
		padding: 0;
		color: #3d3d39;
		font-size: 14px;
		line-height: 1.8;
		list-style: none;
	}
</style>
