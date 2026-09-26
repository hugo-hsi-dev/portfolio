<script lang="ts">
	import Section from './Section.svelte';
	import { reveal } from '$lib/actions/reveal';
	import { technologies } from '$lib/data/portfolio';
</script>

<Section id="tech" title="Technical Skills">
	<div use:reveal class="grid grid-cols-2 gap-8 md:grid-cols-3 lg:gap-12">
		{#each technologies as group (group.label)}
			<div>
				<h3 class="mb-4 font-sans text-xs font-normal tracking-[0.2em] text-stone uppercase">
					{group.label}
				</h3>
				<ul class="m-0 grid list-none gap-2 p-0 text-base">
					{#each group.items as item (item)}<li>{item}</li>{/each}
				</ul>
			</div>
		{/each}
	</div>
</Section>
