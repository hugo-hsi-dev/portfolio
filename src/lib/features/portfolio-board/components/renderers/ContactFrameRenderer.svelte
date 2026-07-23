<script lang="ts">
	/* eslint-disable svelte/no-navigation-without-resolve -- Validated external URLs and mailto links are not SvelteKit routes. */
	import { ExternalLink, Mail, UsersRound } from '@lucide/svelte';

	import type { ContactCanvasFrame } from '$lib/features/portfolio-content';
	import BrandIcon from '$lib/ui/BrandIcon.svelte';

	let { frame }: { frame: ContactCanvasFrame } = $props();
</script>

<section class="contact-frame">
	<div class="frame-eyebrow"><UsersRound size={14} /> Open to opportunities</div>
	<h2>{frame.site.metadata.footer.heading}</h2>
	<p>{frame.site.metadata.footer.intro}</p>
	<a class="email-card" href={`mailto:${frame.site.metadata.contact.email}`}>
		<Mail size={18} /><span>Email me<small>{frame.site.metadata.contact.email}</small></span
		><ExternalLink size={15} />
	</a>
	<div class="contact-links">
		{#if frame.site.metadata.contact.github}<a
				href={frame.site.metadata.contact.github}
				target="_blank"
				rel="noopener noreferrer"><BrandIcon name="github" /> GitHub</a
			>{/if}
		{#if frame.site.metadata.contact.linkedin}<a
				href={frame.site.metadata.contact.linkedin}
				target="_blank"
				rel="noopener noreferrer"><BrandIcon name="linkedin" /> LinkedIn</a
			>{/if}
	</div>
</section>

<style>
	.contact-frame {
		display: flex;
		height: 100%;
		flex-direction: column;
		padding: 46px 38px;
		background: #242424;
		color: white;
	}
	.frame-eyebrow {
		display: flex;
		align-items: center;
		gap: 6px;
		color: #8b8b8b;
		font-size: 10px;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	.contact-frame .frame-eyebrow {
		color: #84d39b;
	}
	.contact-frame h2 {
		max-width: 270px;
		margin: 34px 0 12px;
		font-family: var(--font-serif);
		font-size: 42px;
		font-weight: 400;
		line-height: 0.95;
	}
	.contact-frame > p {
		color: #aaa;
		font-size: 12px;
		line-height: 1.5;
	}
	.email-card {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-top: auto;
		padding: 11px 0;
		border-block: 1px solid #454545;
		color: white;
		text-decoration: none;
	}
	.email-card > span {
		display: flex;
		min-width: 0;
		flex: 1;
		flex-direction: column;
		font-size: 11px;
		font-weight: 600;
	}
	.email-card small {
		overflow: hidden;
		color: #aaa;
		font-size: 10px;
		font-weight: 400;
		text-overflow: ellipsis;
	}
	.contact-links {
		display: flex;
		gap: 18px;
		margin-top: 18px;
	}
	.contact-links a {
		display: flex;
		align-items: center;
		gap: 6px;
		color: #b9b9b9;
		font-size: 10px;
		text-decoration: none;
	}
	.contact-links :global(svg) {
		width: 13px;
		height: 13px;
	}
</style>
