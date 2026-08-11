<script lang="ts">
	/* eslint-disable svelte/no-navigation-without-resolve -- Validated external URLs and mailto links are not SvelteKit routes. */
	import type { ContactCanvasFrame } from '$lib/features/portfolio-content';

	let { frame }: { frame: ContactCanvasFrame } = $props();
</script>

<section class="contact-frame">
	<div class="frame-eyebrow">Open to opportunities</div>
	<h2>{frame.site.metadata.footer.heading}</h2>
	<p>{frame.site.metadata.footer.intro}</p>
	<a class="email-link" href={`mailto:${frame.site.metadata.contact.email}`}>
		<span>Email me</span>
		<strong>{frame.site.metadata.contact.email}</strong>
	</a>
	<div class="contact-links">
		{#if frame.site.metadata.contact.github}<a
				href={frame.site.metadata.contact.github}
				target="_blank"
				rel="noopener noreferrer">GitHub</a
			>{/if}
		{#if frame.site.metadata.contact.linkedin}<a
				href={frame.site.metadata.contact.linkedin}
				target="_blank"
				rel="noopener noreferrer">LinkedIn</a
			>{/if}
	</div>
</section>

<style>
	.contact-frame {
		display: flex;
		height: 100%;
		flex-direction: column;
		padding: 42px 48px;
		background: #fafaf8;
		color: #20201e;
	}
	.frame-eyebrow {
		color: #6f6f6a;
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	.contact-frame h2 {
		max-width: 360px;
		margin: 28px 0 10px;
		font-family: var(--font-serif);
		font-size: 44px;
		font-weight: 400;
		letter-spacing: -0.022em;
		line-height: 0.98;
	}
	.contact-frame > p {
		max-width: 390px;
		margin: 0;
		color: #62625d;
		font-size: 14px;
		line-height: 1.5;
	}
	.email-link {
		display: flex;
		align-items: center;
		gap: 8px;
		align-self: flex-start;
		margin-top: 24px;
		color: #20201e;
		font-size: 12px;
		text-decoration: none;
	}
	.email-link span {
		font-weight: 600;
	}
	.email-link strong {
		border-bottom: 1px solid #9a9a95;
		font-weight: 500;
	}
	.contact-links {
		display: flex;
		gap: 20px;
		margin-top: auto;
		padding-top: 16px;
		border-top: 1px solid #dcdcd7;
	}
	.contact-links a {
		color: #555550;
		font-size: 12px;
		font-weight: 600;
		text-decoration-color: #9a9a95;
		text-underline-offset: 3px;
	}
	.email-link:focus-visible,
	.contact-links a:focus-visible {
		outline: 2px solid #2868d8;
		outline-offset: 3px;
	}
</style>
