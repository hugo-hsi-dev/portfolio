<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		href,
		children,
		variant = 'solid',
		ariaLabel
	}: {
		href: string;
		children: Snippet;
		variant?: 'solid' | 'outline';
		ariaLabel?: string;
	} = $props();

	let isExternal = $derived(/^https?:\/\//.test(href));
	let opensNewTab = $derived(isExternal || href.toLowerCase().endsWith('.pdf'));
</script>

<a
	class={['ink-link', `ink-link--${variant}`]}
	{href}
	target={opensNewTab ? '_blank' : undefined}
	rel={isExternal ? 'noopener noreferrer' : undefined}
	aria-label={ariaLabel}
>
	<span>{@render children()}</span>
</a>

<style>
	.ink-link {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 2.75rem;
		overflow: hidden;
		border: 1px solid var(--color-charcoal);
		padding: 0.75rem 1.5rem;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		isolation: isolate;
	}

	.ink-link::before {
		position: absolute;
		z-index: -1;
		inset: 0;
		background: var(--color-charcoal);
		content: '';
		transform: scaleX(0);
		transform-origin: left;
	}

	.ink-link--solid {
		background: var(--color-charcoal);
		color: var(--color-cream);
	}

	.ink-link--solid::before {
		background: var(--color-border);
	}

	.ink-link--outline {
		background: transparent;
		color: var(--color-charcoal);
	}

	@media (hover: hover) and (pointer: fine) {
		.ink-link::before {
			transition: transform 220ms var(--ease-out);
		}

		.ink-link:hover::before {
			transform: scaleX(1);
		}

		.ink-link--outline:hover {
			color: var(--color-cream);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.ink-link::before {
			display: none;
		}
	}

	@media (prefers-reduced-motion: reduce) and (hover: hover) and (pointer: fine) {
		.ink-link--outline:hover {
			background: var(--color-charcoal);
			color: var(--color-cream);
		}
	}
</style>
