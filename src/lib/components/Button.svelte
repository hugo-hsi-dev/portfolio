<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes } from 'svelte/elements';
	import { reveal, type RevealOptions } from '$lib/actions/reveal';

	let {
		children,
		variant = 'solid',
		entrance = false,
		...attributes
	}: Omit<HTMLAnchorAttributes, 'class'> & {
		children: Snippet;
		variant?: 'solid' | 'outline';
		entrance?: RevealOptions | false;
	} = $props();
</script>

<!-- A navigation button: callers supply a fragment or resolved asset URL. -->
<a
	{...attributes}
	use:reveal={entrance}
	class={[
		"relative isolate inline-flex min-h-[46px] items-center justify-center gap-2.5 overflow-hidden border border-charcoal px-6 py-3 text-sm leading-5 tracking-[0.05em] uppercase transition-[color,background-color,scale] duration-300 before:absolute before:inset-0 before:-z-10 before:-translate-x-[101%] before:transition-transform before:duration-400 before:ease-reveal before:content-[''] hover:before:translate-x-0 focus-visible:before:translate-x-0 active:scale-[0.98] motion-reduce:transition-none motion-reduce:before:transition-none",
		variant === 'outline'
			? 'bg-transparent text-charcoal before:bg-charcoal hover:text-cream focus-visible:text-cream'
			: 'bg-charcoal text-cream before:bg-border'
	]}><span>{@render children()}</span></a
>
