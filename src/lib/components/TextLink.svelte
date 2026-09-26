<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes } from 'svelte/elements';

	let {
		label,
		class: className,
		children,
		...rest
	}: HTMLAnchorAttributes & { label: string; children?: Snippet } = $props();
</script>

<a {...rest} class={['group/link inline-flex items-center gap-1.5 text-sm/normal', className]}
	><span
		class="relative after:absolute after:inset-x-0 after:-bottom-[3px] after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-300 after:ease-soft group-hover/link:after:scale-x-100 group-focus-visible/link:after:scale-x-100"
		>{label}</span
	>{@render children?.()}</a
>
