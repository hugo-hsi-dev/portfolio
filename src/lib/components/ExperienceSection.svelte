<script lang="ts">
	import Section from './Section.svelte';
	import { reveal } from '$lib/actions/reveal';
	import { experience } from '$lib/data/portfolio';
</script>

<Section id="experience" title="Experience" class="bg-charcoal text-cream">
	<ol class="border-b border-border">
		{#each experience as item, index (item.company)}
			<li class="group border-t border-border transition-colors duration-300 hover:border-gold">
				<article
					use:reveal={{ delay: index * 80 }}
					class="grid gap-x-10 gap-y-3 py-10 md:grid-cols-[4rem_10rem_1fr] lg:grid-cols-[5rem_12rem_1fr]"
				>
					<span
						aria-hidden="true"
						class="font-serif text-3xl leading-none text-stone/50 transition-colors duration-300 group-hover:text-gold lg:text-4xl"
					>
						{String(index + 1).padStart(2, '0')}
					</span>
					<p class="text-xs leading-normal tracking-[0.2em] text-stone uppercase md:pt-2">
						{item.date}
					</p>
					<div>
						<h3 class="font-serif text-2xl leading-[1.2] font-normal lg:text-3xl">{item.role}</h3>
						<p class="mt-1 text-base text-gold">{item.company}</p>
						{#if item.highlights?.length}
							<ul class="mt-5 grid max-w-2xl gap-2 text-base leading-relaxed text-stone-light">
								{#each item.highlights as highlight (highlight)}
									<li
										class="relative pl-5 before:absolute before:top-[0.7em] before:left-0 before:h-px before:w-2.5 before:bg-gold"
									>
										{highlight}
									</li>
								{/each}
							</ul>
						{/if}
					</div>
				</article>
			</li>
		{/each}
	</ol>
</Section>
