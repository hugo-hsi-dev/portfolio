<script lang="ts">
	import './layout.css';
	import { asset } from '$app/paths';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link
		rel="preload"
		href={asset('/fonts/forum.ttf')}
		as="font"
		type="font/ttf"
		crossorigin="anonymous"
	/>
	<link
		rel="preload"
		href={asset('/fonts/outfit.ttf')}
		as="font"
		type="font/ttf"
		crossorigin="anonymous"
	/>
</svelte:head>
{@render children()}
