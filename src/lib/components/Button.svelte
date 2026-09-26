<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes } from 'svelte/elements';

	let {
		variant = 'solid',
		class: className,
		children,
		...rest
	}: HTMLAnchorAttributes & { variant?: 'solid' | 'outline'; children: Snippet } = $props();
</script>

<a
	{...rest}
	class={[
		'relative isolate inline-flex min-h-11.5 items-center justify-center gap-2.5 overflow-hidden border border-charcoal px-6 py-3 text-sm/5 tracking-wider uppercase transition-[color,background-color,scale] duration-300 active:scale-[0.98]',
		'before:absolute before:inset-0 before:-z-10 before:-translate-x-[101%] before:transition-transform before:duration-400 before:ease-soft hover:before:translate-x-0 focus-visible:before:translate-x-0',
		variant === 'solid' && 'bg-charcoal text-cream before:bg-border',
		variant === 'outline' &&
			'bg-transparent text-charcoal before:bg-charcoal hover:text-cream focus-visible:text-cream',
		className
	]}>{@render children()}</a
>
