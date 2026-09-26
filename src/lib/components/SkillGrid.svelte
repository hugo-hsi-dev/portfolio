<script lang="ts">
	import { reveal, revealClasses } from '$lib/attachments/reveal';
	import type { SkillGroup } from '$lib/content';

	let { groups }: { groups: SkillGroup[] } = $props();
</script>

<div class={['grid grid-cols-2 gap-8 md:grid-cols-3 lg:gap-12', revealClasses]} {@attach reveal}>
	{#each groups as group (group.label)}
		<div>
			<h3 class="mb-4 text-xs/normal tracking-label text-stone uppercase">{group.label}</h3>
			<ul class="grid gap-2">
				{#each group.items as item (item)}<li>{item}</li>{/each}
			</ul>
		</div>
	{/each}
</div>
