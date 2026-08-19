<script lang="ts">
	import type { ProjectStory as ProjectStoryData } from '#lib/portfolio.js';

	let { project, index }: { project: ProjectStoryData; index: number } = $props();
</script>

<article id={project.slug} class="group border-t border-rule py-14 sm:py-20 lg:py-28">
	<div class="grid items-start gap-10 lg:grid-cols-12 lg:gap-8">
		<figure
			class={['lg:col-span-7', index % 2 === 1 ? 'lg:order-2 lg:col-start-6' : 'lg:col-start-1']}
		>
			<a
				href={project.liveUrl}
				target="_blank"
				rel="noreferrer"
				aria-label={'Visit the live ' + project.title + ' website'}
				class="block overflow-hidden border border-rule bg-surface"
			>
				<img
					src={project.image}
					alt={project.imageAlt}
					width="1600"
					height="900"
					loading={index === 0 ? 'eager' : 'lazy'}
					fetchpriority={index === 0 ? 'high' : 'auto'}
					decoding="async"
					class="aspect-video h-auto w-full object-cover"
				/>
			</a>
		</figure>

		<div
			class={['lg:col-span-5', index % 2 === 1 ? 'lg:order-1 lg:col-start-1' : 'lg:col-start-8']}
		>
			<div
				class="mb-7 flex items-center justify-between gap-4 font-utility text-[0.68rem] tracking-[0.12em] text-muted uppercase"
			>
				<span>Work {String(index + 1).padStart(2, '0')}</span>
				<span>{project.period}</span>
			</div>

			<p class="mb-3 text-xs font-semibold tracking-[0.14em] text-diagnose uppercase">
				{project.context}
			</p>
			<h3 class="font-display text-4xl leading-[0.98] sm:text-5xl lg:text-[3.4rem]">
				<a
					href={project.liveUrl}
					target="_blank"
					rel="noreferrer"
					class="inline-flex items-end gap-3"
				>
					<span>{project.title}</span>
					<span
						aria-hidden="true"
						class="project-arrow mb-1 text-xl text-build transition-transform duration-200 group-hover:translate-x-1"
						>↗</span
					>
				</a>
			</h3>
			<p class="mt-5 max-w-xl text-lg leading-relaxed text-muted">{project.summary}</p>

			<ol class="mt-9" aria-label={project.title + ' problem-to-proof trace'}>
				{#each project.stages as stage, stageIndex (stage.id)}
					<li class="trace-stage relative grid grid-cols-[1.25rem_1fr] gap-4 pb-7 last:pb-0">
						<div class="relative flex justify-center" aria-hidden="true">
							<span
								class={[
									'trace-dot z-10 mt-1.5 size-2.5 rounded-full border-2 bg-field transition-colors duration-200',
									stage.id === 'found' &&
										'border-diagnose group-focus-within:bg-diagnose group-hover:bg-diagnose',
									stage.id === 'built' &&
										'border-build group-focus-within:bg-build group-hover:bg-build',
									stage.id === 'changed' &&
										'border-proof group-focus-within:bg-proof group-hover:bg-proof'
								]}
							></span>
							{#if stageIndex < project.stages.length - 1}
								<span class="absolute top-4 bottom-[-0.4rem] w-px bg-rule">
									<span
										class={[
											'trace-fill absolute inset-0 origin-top scale-y-0 transition-transform duration-300 group-focus-within:scale-y-100 group-hover:scale-y-100',
											stageIndex === 0 ? 'bg-diagnose' : 'bg-build delay-[120ms]'
										]}
									></span>
								</span>
							{/if}
						</div>
						<div>
							<p
								class={[
									'mb-1 text-[0.68rem] font-semibold tracking-[0.14em] uppercase',
									stage.id === 'found' && 'text-diagnose',
									stage.id === 'built' && 'text-build',
									stage.id === 'changed' && 'text-proof'
								]}
							>
								{stage.label}
							</p>
							<p class="max-w-xl leading-relaxed text-ink/86">{stage.text}</p>
						</div>
					</li>
				{/each}
			</ol>

			<p
				class="mt-9 border-t border-rule pt-4 font-utility text-[0.68rem] leading-relaxed tracking-[0.08em] text-muted uppercase"
			>
				{project.technologies.join(' / ')}
			</p>
		</div>
	</div>
</article>

<style>
	@media (hover: none) {
		.trace-fill {
			transform: scaleY(1);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.trace-fill {
			transform: scaleY(1);
		}

		.project-arrow {
			transform: none;
		}
	}
</style>
