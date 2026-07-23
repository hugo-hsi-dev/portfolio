<script lang="ts">
	/* eslint-disable svelte/no-navigation-without-resolve -- Validated external URLs and mailto links are not SvelteKit routes. */
	import type { ProfileCanvasFrame } from '$lib/features/portfolio-content';

	let { frame, onOpenProjects }: { frame: ProfileCanvasFrame; onOpenProjects: () => void } =
		$props();
</script>

<section class="profile-frame">
	<div class="profile-kicker"><span></span> Full-stack developer · NYC</div>
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
		padding: 52px 58px;
		background: #f8f8f6;
	}
	.profile-kicker {
		display: flex;
		align-items: center;
		gap: 8px;
		color: #6d6d6d;
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}
	.profile-kicker span {
		width: 22px;
		height: 1px;
		background: #1e1e1e;
	}
	.profile-frame h1 {
		margin: 22px 0 12px;
		font-family: var(--font-serif);
		font-size: 78px;
		font-weight: 400;
		letter-spacing: -0.045em;
		line-height: 0.76;
	}
	.profile-tagline {
		max-width: 470px;
		margin: 12px 0 0;
		font-size: 20px;
		font-weight: 500;
		line-height: 1.25;
	}
	.profile-intro {
		max-width: 510px;
		margin: 10px 0 0;
		color: #646464;
		font-size: 12px;
		line-height: 1.55;
	}
	.profile-actions {
		display: flex;
		gap: 18px;
		align-items: center;
		margin-top: 22px;
	}
	.profile-actions button,
	.profile-actions a {
		border: 0;
		background: transparent;
		color: #202020;
		font-size: 11px;
		font-weight: 600;
		text-decoration: none;
	}
	.profile-actions button {
		padding: 8px 13px;
		border-radius: 4px;
		background: #1e1e1e;
		color: #fff;
	}
	.profile-actions a {
		border-bottom: 1px solid #999;
	}
	@media (max-width: 800px) {
		.profile-frame {
			padding: 46px;
		}
	}
</style>
