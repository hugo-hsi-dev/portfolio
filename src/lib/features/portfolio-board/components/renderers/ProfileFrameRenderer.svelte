<script lang="ts">
	/* eslint-disable svelte/no-navigation-without-resolve -- Validated external URLs and mailto links are not SvelteKit routes. */
	import type { ProfileCanvasFrame } from '$lib/features/portfolio-content';

	let { frame, onOpenProjects }: { frame: ProfileCanvasFrame; onOpenProjects: () => void } =
		$props();
</script>

<section class="profile-frame">
	<div class="profile-kicker">Full-stack developer <span aria-hidden="true">·</span> NYC</div>
	<h1>{frame.site.metadata.hero.firstName}<br />{frame.site.metadata.hero.lastName}</h1>
	<p class="profile-tagline">{frame.site.metadata.hero.tagline}</p>
	{#if frame.site.metadata.hero.intro}
		<p class="profile-intro">{frame.site.metadata.hero.intro}</p>
	{/if}
	<div class="profile-actions">
		<button type="button" onclick={onOpenProjects}
			>{frame.site.metadata.hero.ctaPrimary.text}</button
		>
		{#if frame.site.metadata.resumeUrl}
			<a href={frame.site.metadata.resumeUrl} target="_blank" rel="noopener noreferrer"
				>{frame.site.metadata.hero.ctaSecondary?.text ?? 'View resume'}</a
			>
		{:else}
			<a href={`mailto:${frame.site.metadata.contact.email}`}>Start a conversation</a>
		{/if}
	</div>
</section>

<style>
	.profile-frame {
		display: flex;
		height: 100%;
		flex-direction: column;
		justify-content: center;
		padding: 58px 64px;
		background: #fafaf8;
		color: #20201e;
	}
	.profile-kicker {
		display: flex;
		align-items: center;
		gap: 7px;
		color: #6f6f6a;
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.075em;
		text-transform: uppercase;
	}
	.profile-kicker span {
		color: #a0a09a;
	}
	.profile-frame h1 {
		margin: 20px 0 14px;
		font-family: var(--font-serif);
		font-size: 76px;
		font-weight: 400;
		letter-spacing: -0.035em;
		line-height: 0.88;
	}
	.profile-tagline {
		max-width: 470px;
		margin: 8px 0 0;
		font-size: 21px;
		font-weight: 500;
		letter-spacing: -0.012em;
		line-height: 1.3;
	}
	.profile-intro {
		max-width: 500px;
		margin: 12px 0 0;
		color: #656560;
		font-size: 14px;
		line-height: 1.5;
	}
	.profile-actions {
		display: flex;
		gap: 20px;
		align-items: center;
		margin-top: 24px;
	}
	.profile-actions button,
	.profile-actions a {
		border: 0;
		background: transparent;
		color: #202020;
		font: inherit;
		font-size: 12px;
		font-weight: 600;
		text-decoration: none;
	}
	.profile-actions button {
		padding: 9px 14px;
		border-radius: 4px;
		background: #1e1e1e;
		color: #fff;
		cursor: pointer;
	}
	.profile-actions a {
		border-bottom: 1px solid #8e8e89;
	}
	.profile-actions button:focus-visible,
	.profile-actions a:focus-visible {
		outline: 2px solid #2868d8;
		outline-offset: 3px;
	}
</style>
