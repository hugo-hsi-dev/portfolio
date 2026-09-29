<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes } from 'svelte/elements';
	import { prefersReducedMotion } from 'svelte/motion';
	import { MediaQuery } from 'svelte/reactivity';

	type Props = HTMLAnchorAttributes & {
		children: Snippet;
		intensity?: number;
	};

	let {
		children,
		intensity = 0.3,
		onpointermove,
		onpointerleave,
		onpointercancel,
		...attributes
	}: Props = $props();
	const finePointer = new MediaQuery('(hover: hover) and (pointer: fine)', false);
	let translate = $state('');
	const enabled = $derived(finePointer.current && !prefersReducedMotion.current);

	function reset() {
		translate = '';
	}

	function move(event: PointerEvent & { currentTarget: EventTarget & HTMLAnchorElement }) {
		if (enabled && event.pointerType !== 'touch') {
			const bounds = event.currentTarget.getBoundingClientRect();
			const x = (event.clientX - bounds.left - bounds.width / 2) * intensity;
			const y = (event.clientY - bounds.top - bounds.height / 2) * intensity;
			translate = `${x}px ${y}px`;
		}
		onpointermove?.(event);
	}

	$effect(() => {
		if (!enabled) reset();
	});
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- Callers supply fragment or external destinations. -->
<svelte:window onblur={reset} />

<a
	{...attributes}
	onpointermove={move}
	onpointerleave={(event) => {
		reset();
		onpointerleave?.(event);
	}}
	onpointercancel={(event) => {
		reset();
		onpointercancel?.(event);
	}}
>
	<span
		style:translate
		data-magnetic-content
		class="inline-flex items-center gap-3 transition-[translate] duration-300 ease-out motion-reduce:transition-none"
	>
		{@render children()}
	</span>
</a>
<!-- eslint-enable svelte/no-navigation-without-resolve -->
