<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes } from 'svelte/elements';
	import { magnetic } from '$lib/actions/magnetic';

	type Props = HTMLAnchorAttributes & {
		children: Snippet;
		intensity?: number;
	};

	let { children, intensity = 0.3, ...attributes }: Props = $props();
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- Callers supply fragment or external destinations. -->
<a {...attributes} use:magnetic={intensity}>
	<span
		data-magnetic-content
		class="inline-flex items-center gap-3 transition-[translate] duration-300 ease-out motion-reduce:transition-none"
	>
		{@render children()}
	</span>
</a>
<!-- eslint-enable svelte/no-navigation-without-resolve -->
