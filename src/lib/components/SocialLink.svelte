<script lang="ts">
	import type { Snippet } from 'svelte';

	let { href, label, children }: { href: string; label: string; children: Snippet } = $props();
</script>

<a {href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}>
	{@render children()}
</a>

<style>
	a {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.75rem;
		height: 2.75rem;
		color: rgb(255 255 255 / 0.78);
		transition:
			color 180ms ease,
			transform 180ms var(--ease-out);
	}

	a:hover {
		color: white;
		transform: translateY(-2px);
	}

	@media (prefers-reduced-motion: reduce) {
		a {
			transition: none;
		}
	}
</style>
