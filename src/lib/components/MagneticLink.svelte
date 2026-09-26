<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes } from 'svelte/elements';
	import { magnetic } from '$lib/attachments/magnetic';

	let {
		intensity = 0.3,
		children,
		...rest
	}: HTMLAnchorAttributes & { intensity?: number; children: Snippet } = $props();
</script>

<a {...rest} {@attach magnetic(intensity)}
	><span
		data-magnetic-content
		class="inline-flex translate-x-[var(--magnetic-x,0px)] translate-y-[var(--magnetic-y,0px)] items-center gap-3 transition-[translate] duration-600 ease-spring will-change-[translate]"
		>{@render children()}</span
	></a
>
