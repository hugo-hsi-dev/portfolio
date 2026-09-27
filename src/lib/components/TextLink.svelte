<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes } from 'svelte/elements';

	let {
		children,
		arrow = false,
		class: className,
		...attributes
	}: HTMLAnchorAttributes & {
		children: Snippet;
		arrow?: boolean;
	} = $props();
</script>

<!-- Callers supply external, fragment, or already-resolved asset URLs. -->
<a
	{...attributes}
	class={['group/link inline-flex items-center gap-1.5 text-sm leading-normal', className]}
>
	<span
		class="relative after:absolute after:inset-x-0 after:-bottom-[3px] after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-300 after:ease-reveal group-focus-visible/link:after:scale-x-100 motion-reduce:after:transition-none [@media(hover:hover)_and_(pointer:fine)]:group-hover/link:after:scale-x-100"
		>{@render children()}</span
	>
	{#if arrow}<span aria-hidden="true">↗</span>{/if}
</a>
