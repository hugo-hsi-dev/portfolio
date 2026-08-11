<script lang="ts">
	import {
		BookOpenText,
		BriefcaseBusiness,
		ChevronDown,
		Eye,
		EyeOff,
		ExternalLink,
		FileText,
		GraduationCap,
		Keyboard,
		Layers3,
		LocateFixed,
		Lock,
		Menu,
		RotateCcw,
		Scan,
		Sparkles,
		Unlock,
		UserRound,
		X
	} from '@lucide/svelte';
	import { Dialog, DropdownMenu } from 'bits-ui';

	import type { PortfolioContent } from '$lib/features/portfolio-content';

	import type { PortfolioBoardController } from '../board-controller.svelte';

	let { content, controller }: { content: PortfolioContent; controller: PortfolioBoardController } =
		$props();

	const connectionLabels = {
		idle: 'Preparing live canvas',
		connecting: 'Connecting',
		open: 'Live',
		reconnecting: 'Reconnecting',
		offline: 'Offline',
		failed: 'Connection failed',
		closed: 'Offline'
	} as const;
</script>

<header class="topbar">
	<div class="topbar__left">
		<Dialog.Root bind:open={controller.mobileLayersOpen}>
			<Dialog.Trigger class="mobile-layers-toggle" aria-label="Toggle layers">
				<Menu size={18} />
			</Dialog.Trigger>
			<Dialog.Portal>
				<Dialog.Overlay class="mobile-layer-backdrop" />
				<Dialog.Content
					class="mobile-layers"
					onCloseAutoFocus={controller.onMobileLayersCloseAutoFocus}
				>
					<div class="mobile-panel-heading">
						<div>
							<Dialog.Title class="mobile-panel-title">Layers</Dialog.Title>
							<Dialog.Description class="mobile-panel-description">
								Select, locate, hide, or lock a portfolio frame.
							</Dialog.Description>
						</div>
						<Dialog.Close class="mobile-layers-close" aria-label="Close layers">
							<X size={18} />
						</Dialog.Close>
					</div>

					<nav class="mobile-layer-tree" aria-label="Layers">
						<div class="mobile-page-heading" aria-hidden="true">
							<Layers3 size={15} /><span>Portfolio</span>
						</div>
						{#each controller.frames as frame (frame.id)}
							{@const metadata = controller.frameMetadata(frame.id)}
							<div
								class={[
									'mobile-layer-row',
									controller.isSelected(frame.id) && 'is-selected',
									!metadata.visible && 'is-hidden',
									metadata.locked && 'is-locked'
								]}
							>
								<button
									class="mobile-layer-select"
									type="button"
									aria-label={`Select ${frame.title}`}
									aria-pressed={controller.isSelected(frame.id)}
									onclick={(event) => controller.selectFrameFromLayer(event, frame)}
								>
									<span class="mobile-kind-icon" aria-hidden="true">
										{#if frame.kind === 'profile'}<UserRound size={15} />
										{:else if frame.kind === 'project'}<BriefcaseBusiness size={15} />
										{:else if frame.kind === 'education'}<GraduationCap size={15} />
										{:else if frame.kind === 'technologies'}<Sparkles size={15} />
										{:else}<FileText size={15} />{/if}
									</span>
									<span>{frame.title}</span>
								</button>

								<div class="mobile-layer-actions">
									<button
										type="button"
										aria-label={`Go to ${frame.title}`}
										onclick={() => controller.goToFrameFromMobileLayers(frame)}
									>
										<LocateFixed size={15} />
									</button>
									<button
										type="button"
										aria-label={`${metadata.visible ? 'Hide' : 'Show'} ${frame.title}`}
										aria-pressed={!metadata.visible}
										disabled={!controller.editingReady}
										onclick={() => controller.toggleFrameVisibility(frame.id)}
									>
										{#if metadata.visible}<Eye size={15} />{:else}<EyeOff size={15} />{/if}
									</button>
									<button
										type="button"
										aria-label={`${metadata.locked ? 'Unlock' : 'Lock'} ${frame.title}`}
										aria-pressed={metadata.locked}
										disabled={!controller.editingReady}
										onclick={() => controller.toggleFrameLock(frame.id)}
									>
										{#if metadata.locked}<Lock size={15} />{:else}<Unlock size={15} />{/if}
									</button>
								</div>
							</div>
						{/each}
					</nav>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>

		<DropdownMenu.Root>
			<DropdownMenu.Trigger class="file-trigger" aria-label="Open file menu">
				<span class="file-mark" aria-hidden="true">H</span>
				<span class="file-identity">
					<strong>Hugo Hsi</strong>
					<span>Portfolio file</span>
				</span>
				<ChevronDown class="file-chevron" size={13} />
			</DropdownMenu.Trigger>
			<DropdownMenu.Portal>
				<DropdownMenu.Content class="file-menu" sideOffset={6} align="start">
					<div class="file-menu__heading">Portfolio file</div>
					<DropdownMenu.Item class="file-menu__item" onSelect={controller.fitAll}>
						<Scan size={15} /> <span>Fit all</span><kbd>⇧1</kbd>
					</DropdownMenu.Item>
					<DropdownMenu.Item
						class="file-menu__item"
						onSelect={() => (controller.browseOpen = true)}
					>
						<BookOpenText size={15} /> <span>Browse portfolio</span>
					</DropdownMenu.Item>
					<DropdownMenu.Item
						class="file-menu__item"
						onSelect={() => (controller.shortcutDialogOpen = true)}
					>
						<Keyboard size={15} /> <span>Keyboard shortcuts</span><kbd>?</kbd>
					</DropdownMenu.Item>
					<DropdownMenu.Separator class="file-menu__separator" />
					<DropdownMenu.Item
						class="file-menu__item file-menu__item--danger"
						onSelect={() => (controller.resetDialogOpen = true)}
					>
						<RotateCcw size={15} /> <span>Reset board</span>
					</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Portal>
		</DropdownMenu.Root>
	</div>

	<div class="topbar__center" aria-label="Current page">
		<FileText size={13} />
		<span>Portfolio</span>
		<span class="page-divider">/</span>
		<strong>Canvas</strong>
	</div>

	<div class="topbar__right">
		<div
			class="collaborators"
			role="group"
			aria-label={`${controller.collaborators.length} collaborators`}
		>
			{#if controller.peerModel.self}
				<span
					class="collaborator-avatar is-self"
					style:--avatar-color={controller.peerModel.self.color}
					title={`${controller.peerModel.self.name} (you)`}
					aria-label={`${controller.peerModel.self.name} (you)`}
				>
					{controller.peerModel.self.name.slice(0, 1)}
				</span>
			{/if}
			{#each controller.peerModel.peers.slice(0, 4) as peer (peer.sessionId)}
				<button
					type="button"
					class={[
						'collaborator-avatar',
						controller.followingSessionId === peer.sessionId && 'is-following'
					]}
					style:--avatar-color={peer.color}
					aria-label={`${controller.followingSessionId === peer.sessionId ? 'Stop following' : 'Follow'} ${peer.name}`}
					aria-pressed={controller.followingSessionId === peer.sessionId}
					title={`${controller.followingSessionId === peer.sessionId ? 'Stop following' : 'Follow'} ${peer.name}`}
					onclick={() => controller.followCollaborator(peer)}
				>
					{peer.name.slice(0, 1)}
				</button>
			{/each}
		</div>

		<span
			class={['connection-status', `is-${controller.connectionState}`]}
			role="status"
			aria-label={connectionLabels[controller.connectionState]}
			data-connection-state={controller.connectionState}
		>
			<span class="connection-dot"></span>
			<span class="connection-label">{connectionLabels[controller.connectionState]}</span>
		</span>

		<button
			class="browse-button"
			type="button"
			aria-label="Browse portfolio"
			onclick={() => (controller.browseOpen = true)}
		>
			<BookOpenText size={14} /> <span>Browse</span>
		</button>

		{#if content.site.metadata.resumeUrl}
			<a
				class="resume-button"
				href={content.site.metadata.resumeUrl}
				target="_blank"
				rel="noopener noreferrer"
			>
				Resume <ExternalLink size={13} />
			</a>
		{/if}
	</div>
</header>

<style>
	.topbar {
		position: relative;
		z-index: 50;
		display: grid;
		grid-template-columns: minmax(250px, 1fr) auto minmax(340px, 1fr);
		height: 48px;
		align-items: center;
		padding: 0 9px 0 7px;
		border-bottom: 1px solid #0d0e10;
		background: #202124;
		color: #f1f2f3;
		box-shadow: 0 1px 2px rgb(0 0 0 / 28%);
	}

	.topbar__left,
	.topbar__right,
	.topbar__center,
	.file-trigger,
	.collaborators,
	.connection-status,
	.browse-button,
	.resume-button {
		display: flex;
		align-items: center;
	}

	.topbar__left,
	.topbar__right {
		min-width: 0;
	}

	.topbar__right {
		justify-content: flex-end;
		gap: 9px;
	}

	.file-trigger {
		min-width: 0;
		gap: 8px;
		padding: 3px 6px 3px 3px;
		border: 0;
		border-radius: 5px;
		background: transparent;
		color: inherit;
		text-align: left;
	}

	.file-trigger:hover,
	.file-trigger:focus-visible,
	.browse-button:hover,
	.browse-button:focus-visible {
		background: #34363a;
	}

	.file-trigger:focus-visible,
	.browse-button:focus-visible,
	.resume-button:focus-visible,
	.collaborator-avatar:focus-visible,
	:global(.mobile-layers-toggle:focus-visible) {
		outline: 2px solid #64b5f6;
		outline-offset: 1px;
	}

	.file-mark {
		display: grid;
		width: 28px;
		height: 28px;
		flex: none;
		place-items: center;
		border: 1px solid #7c66f2;
		border-radius: 6px;
		background: #6553ce;
		color: white;
		font-family: var(--font-serif);
		font-size: 18px;
		line-height: 1;
	}

	.file-identity {
		display: grid;
		min-width: 0;
		gap: 1px;
		line-height: 1.05;
	}

	.file-identity strong,
	.file-identity > span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.file-identity strong {
		font-size: 12px;
		font-weight: 560;
	}

	.file-identity > span {
		color: #9fa3aa;
		font-size: 9px;
		letter-spacing: 0.025em;
	}

	.file-chevron {
		flex: none;
		color: #9da1a8;
	}

	.topbar__center {
		gap: 6px;
		color: #aeb2b8;
		font-size: 10px;
		letter-spacing: 0.015em;
	}

	.topbar__center strong {
		color: #f0f1f2;
		font-weight: 500;
	}

	.page-divider {
		color: #62666d;
	}

	:global(.mobile-layers-toggle) {
		display: none;
	}

	.collaborators {
		flex-direction: row-reverse;
		padding-left: 5px;
	}

	.collaborator-avatar {
		display: grid;
		width: 27px;
		height: 27px;
		margin-left: -5px;
		padding: 0;
		border: 2px solid #202124;
		place-items: center;
		border-radius: 50%;
		background: var(--avatar-color);
		color: white;
		font: inherit;
		font-size: 10px;
		font-weight: 650;
		text-transform: uppercase;
	}

	button.collaborator-avatar {
		cursor: pointer;
	}

	.collaborator-avatar.is-following {
		box-shadow: 0 0 0 2px #8dccff;
	}

	.connection-status {
		gap: 6px;
		color: #b7bbc1;
		font-size: 10px;
		white-space: nowrap;
	}

	.connection-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #d8a449;
	}

	.is-open .connection-dot {
		background: #51c878;
		box-shadow: 0 0 0 3px rgb(81 200 120 / 11%);
	}

	.is-offline .connection-dot,
	.is-closed .connection-dot,
	.is-failed .connection-dot {
		background: #858a92;
		box-shadow: none;
	}

	.browse-button,
	.resume-button {
		height: 30px;
		gap: 5px;
		border-radius: 5px;
		font-size: 10px;
		font-weight: 550;
	}

	.browse-button {
		padding: 0 8px;
		border: 1px solid #484b50;
		background: transparent;
		color: #eceef0;
	}

	.resume-button {
		padding: 0 9px;
		background: #f4f5f6;
		color: #202124;
		text-decoration: none;
	}

	:global(.file-menu) {
		z-index: 100;
		min-width: 236px;
		padding: 5px;
		border: 1px solid #4a4d53;
		border-radius: 7px;
		background: #292b2f;
		color: #eff0f2;
		box-shadow: 0 12px 32px rgb(0 0 0 / 40%);
	}

	:global(.file-menu__heading) {
		padding: 7px 9px 6px;
		color: #8f949c;
		font-size: 9px;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	:global(.file-menu__item) {
		display: grid;
		grid-template-columns: 16px minmax(0, 1fr) auto;
		align-items: center;
		gap: 8px;
		min-height: 32px;
		padding: 0 9px;
		border-radius: 4px;
		font-size: 11px;
		outline: none;
	}

	:global(.file-menu__item[data-highlighted]) {
		background: #41444a;
	}

	:global(.file-menu__item kbd) {
		color: #9da1a8;
		font-family: inherit;
		font-size: 10px;
	}

	:global(.file-menu__item--danger) {
		color: #ff9c9c;
	}

	:global(.file-menu__separator) {
		height: 1px;
		margin: 4px;
		background: #44474d;
	}

	:global(.mobile-layers),
	:global(.mobile-layer-backdrop) {
		display: none;
	}

	@media (max-width: 980px) {
		.topbar {
			grid-template-columns: minmax(220px, 1fr) auto;
		}

		.topbar__center,
		.connection-label {
			display: none;
		}
	}

	@media (max-width: 800px) {
		.topbar {
			grid-template-columns: minmax(0, 1fr) auto;
			height: 46px;
			padding-inline: 4px 6px;
		}

		.topbar__left {
			gap: 2px;
		}

		:global(.mobile-layers-toggle) {
			display: grid;
			width: 44px;
			height: 44px;
			padding: 0;
			border: 0;
			place-items: center;
			border-radius: 5px;
			background: transparent;
			color: #eff0f2;
		}

		.file-trigger {
			max-width: calc(100vw - 214px);
			padding-left: 1px;
		}

		.file-mark,
		.file-identity > span,
		.file-chevron,
		.collaborators,
		.connection-status,
		.browse-button span,
		.resume-button {
			display: none;
		}

		.file-identity strong {
			font-size: 12px;
		}

		.browse-button {
			width: 44px;
			height: 44px;
			justify-content: center;
			padding: 0;
			border: 0;
		}

		:global(.mobile-layer-backdrop) {
			position: fixed;
			z-index: 80;
			inset: 46px 0 0;
			display: block;
			width: 100%;
			padding: 0;
			border: 0;
			background: rgb(11 13 17 / 38%);
			backdrop-filter: blur(1px);
		}

		:global(.mobile-layers) {
			position: fixed;
			z-index: 90;
			top: 46px;
			bottom: 0;
			left: 0;
			display: block;
			width: min(340px, 90vw);
			padding: 0 0 24px;
			border: 0;
			overflow: auto;
			background: #f7f8fa;
			color: #292c31;
			box-shadow: 8px 0 30px rgb(0 0 0 / 20%);
		}

		:global(.mobile-panel-heading) {
			display: flex;
			min-height: 64px;
			align-items: center;
			justify-content: space-between;
			padding: 8px 8px 8px 16px;
			border-bottom: 1px solid #dbdde1;
		}

		:global(.mobile-panel-title) {
			font-size: 14px;
			font-weight: 650;
		}

		:global(.mobile-panel-description) {
			margin-top: 2px;
			color: #6f747c;
			font-size: 11px;
		}

		:global(.mobile-layers-close) {
			display: grid;
			width: 44px;
			height: 44px;
			padding: 0;
			border: 0;
			place-items: center;
			border-radius: 5px;
			background: transparent;
			color: #555a62;
		}

		:global(.mobile-layers-close:focus-visible),
		:global(.mobile-layer-row button:focus-visible) {
			outline: 2px solid var(--figma-blue);
			outline-offset: -2px;
		}

		:global(.mobile-page-heading) {
			display: flex;
			height: 42px;
			align-items: center;
			gap: 7px;
			padding: 0 14px;
			border-bottom: 1px solid #e2e4e7;
			font-size: 12px;
			font-weight: 650;
		}

		:global(.mobile-layer-row) {
			display: flex;
			min-width: 0;
			min-height: 48px;
			align-items: center;
			border-bottom: 1px solid #e8e9ec;
		}

		:global(.mobile-layer-row.is-selected) {
			background: #dcecff;
			color: #075b9a;
		}

		:global(.mobile-layer-row.is-hidden .mobile-layer-select) {
			opacity: 0.46;
		}

		:global(.mobile-layer-select) {
			display: flex;
			min-width: 0;
			flex: 1;
			align-items: center;
			gap: 8px;
			align-self: stretch;
			padding: 0 6px 0 18px;
			border: 0;
			background: transparent;
			color: inherit;
			font: inherit;
			font-size: 12px;
			text-align: left;
		}

		:global(.mobile-layer-select > span:last-child) {
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		:global(.mobile-kind-icon) {
			display: grid;
			flex: none;
			place-items: center;
			color: #747982;
		}

		:global(.mobile-layer-actions) {
			display: flex;
			flex: none;
			padding-right: 2px;
		}

		:global(.mobile-layer-actions button) {
			display: grid;
			width: 44px;
			height: 44px;
			padding: 0;
			border: 0;
			place-items: center;
			border-radius: 5px;
			background: transparent;
			color: #5d626b;
		}

		:global(.mobile-layer-actions button:disabled) {
			opacity: 0.28;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		:global(.mobile-layer-backdrop) {
			backdrop-filter: none;
		}
	}
</style>
