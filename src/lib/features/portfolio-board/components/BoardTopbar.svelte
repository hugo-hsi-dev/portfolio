<script lang="ts">
	import {
		ChevronDown,
		ExternalLink,
		FileText,
		List,
		Menu,
		RotateCcw,
		Scan,
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
			<Dialog.Trigger class="tool-button mobile-layers-toggle" aria-label="Toggle layers">
				<Menu size={17} />
			</Dialog.Trigger>
			<Dialog.Portal>
				<Dialog.Overlay class="mobile-layer-backdrop" />
				<Dialog.Content
					class="mobile-layers"
					onCloseAutoFocus={controller.onMobileLayersCloseAutoFocus}
				>
					<Dialog.Title class="sr-only">Layers</Dialog.Title>
					<Dialog.Description class="sr-only">
						Choose a portfolio frame to select and center it on the canvas.
					</Dialog.Description>
					<nav aria-label="Layers">
						<div class="panel-heading">
							<span>Layers</span>
							<Dialog.Close class="mobile-layers-close" aria-label="Close layers">
								<X size={16} />
							</Dialog.Close>
						</div>
						{#each controller.frames as frame (frame.id)}
							<button
								type="button"
								class={['layer-row', controller.selectedFrameId === frame.id && 'is-selected']}
								aria-label={`Go to ${frame.title}`}
								onclick={() => controller.goToFrameFromMobileLayers(frame)}
							>
								<FileText size={14} /><span>{frame.title}</span>
							</button>
						{/each}
					</nav>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>

		<DropdownMenu.Root>
			<DropdownMenu.Trigger class="file-trigger" aria-label="Open file menu">
				<span class="file-mark">H</span>
				<span class="file-trigger__name">Hugo Hsi — Portfolio</span>
				<ChevronDown size={14} />
			</DropdownMenu.Trigger>
			<DropdownMenu.Portal>
				<DropdownMenu.Content class="file-menu" sideOffset={6} align="start">
					<DropdownMenu.Item class="file-menu__item" onSelect={controller.fitAll}>
						<Scan size={15} /> Fit all
					</DropdownMenu.Item>
					<DropdownMenu.Item
						class="file-menu__item"
						onSelect={() => (controller.browseOpen = true)}
					>
						<List size={15} /> Browse portfolio
					</DropdownMenu.Item>
					<DropdownMenu.Separator class="file-menu__separator" />
					<DropdownMenu.Item
						class="file-menu__item file-menu__item--danger"
						onSelect={() => (controller.resetDialogOpen = true)}
					>
						<RotateCcw size={15} /> Reset board
					</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Portal>
		</DropdownMenu.Root>
	</div>

	<div class="topbar__center" aria-label="Canvas tools">
		<div class="tool-button is-active" aria-hidden="true"><UserRound size={16} /></div>
		<span class="tool-divider"></span>
		<span class="tool-hint">Drag frames · scroll to pan · pinch to zoom</span>
	</div>

	<div class="topbar__right">
		<div
			class="collaborators"
			role="group"
			aria-label={`${controller.collaborators.length} collaborators`}
		>
			{#each controller.collaborators.slice(0, 4) as collaborator (collaborator.sessionId)}
				<span
					class="collaborator-avatar"
					style:background={collaborator.color}
					title={collaborator.name}
					aria-label={collaborator.name}>{collaborator.name.slice(0, 1)}</span
				>
			{/each}
		</div>
		<span
			class={['connection-status', `is-${controller.connectionState}`]}
			role="status"
			data-connection-state={controller.connectionState}
		>
			<span class="connection-dot"></span>{connectionLabels[controller.connectionState]}
		</span>
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
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		height: 48px;
		padding: 0 10px;
		border-bottom: 1px solid #0d0d0d;
		background: var(--figma-dark);
		color: #f4f4f4;
		box-shadow: 0 1px 3px rgb(0 0 0 / 30%);
	}
	.topbar__left,
	.topbar__right,
	.topbar__center,
	.file-trigger,
	.collaborators,
	.connection-status,
	.resume-button,
	.tool-hint {
		display: flex;
		align-items: center;
	}
	.topbar__right {
		justify-content: flex-end;
		gap: 12px;
		min-width: 0;
	}
	.file-trigger {
		gap: 8px;
		min-width: 0;
		border: 0;
		background: transparent;
		color: inherit;
		padding: 4px 7px;
		border-radius: 4px;
		font-size: 12px;
		font-weight: 500;
	}
	.file-trigger:hover {
		background: #343434;
	}
	.file-mark {
		display: grid;
		width: 24px;
		height: 24px;
		place-items: center;
		border-radius: 5px;
		background: #8d5cff;
		color: white;
		font-family: var(--font-serif);
		font-size: 17px;
	}
	.file-trigger__name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.topbar__center {
		gap: 7px;
	}
	.tool-button {
		display: grid;
		width: 30px;
		height: 30px;
		border: 0;
		place-items: center;
		border-radius: 4px;
		background: transparent;
		color: #ddd;
	}
	.tool-button.is-active {
		background: var(--figma-blue);
		color: white;
	}
	.tool-divider {
		width: 1px;
		height: 18px;
		background: #474747;
	}
	.tool-hint {
		color: #9a9a9a;
		font-size: 11px;
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
		width: 25px;
		height: 25px;
		margin-left: -5px;
		place-items: center;
		border: 2px solid var(--figma-dark);
		border-radius: 50%;
		color: white;
		font-size: 10px;
		font-weight: 600;
		text-transform: uppercase;
	}
	.connection-status {
		gap: 6px;
		color: #bbb;
		font-size: 11px;
		white-space: nowrap;
	}
	.connection-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #e5a83d;
	}
	.is-open .connection-dot {
		background: #4aca76;
		box-shadow: 0 0 0 3px rgb(74 202 118 / 12%);
	}
	.is-offline .connection-dot,
	.is-closed .connection-dot,
	.is-failed .connection-dot {
		background: #888;
	}
	.resume-button {
		gap: 5px;
		padding: 6px 9px;
		border-radius: 4px;
		background: #fff;
		color: #1e1e1e;
		font-size: 11px;
		font-weight: 600;
		text-decoration: none;
	}
	:global(.file-menu) {
		z-index: 100;
		min-width: 190px;
		padding: 5px;
		border: 1px solid #454545;
		border-radius: 6px;
		background: #2c2c2c;
		color: #eee;
		box-shadow: 0 8px 30px rgb(0 0 0 / 35%);
	}
	:global(.file-menu__item) {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 9px;
		border-radius: 4px;
		font-size: 11px;
		outline: none;
	}
	:global(.file-menu__item[data-highlighted]) {
		background: #444;
	}
	:global(.file-menu__item--danger) {
		color: #ff8989;
	}
	:global(.file-menu__separator) {
		height: 1px;
		margin: 4px;
		background: #494949;
	}
	:global(.mobile-layers),
	:global(.mobile-layer-backdrop) {
		display: none;
	}
	:global(.mobile-layers .panel-heading) {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 40px;
		padding: 0 9px 0 13px;
		border-bottom: 1px solid #dedede;
		font-size: 11px;
		font-weight: 600;
	}
	:global(.mobile-layers .layer-row) {
		display: flex;
		width: 100%;
		align-items: center;
		gap: 8px;
		padding: 7px 8px;
		border: 0;
		border-radius: 4px;
		background: transparent;
		color: #565656;
		font-size: 11px;
		text-align: left;
	}
	:global(.mobile-layers .layer-row.is-selected) {
		background: #daedfb;
		color: #075f9e;
	}
	@media (max-width: 800px) {
		.topbar {
			grid-template-columns: 1fr auto;
			height: 46px;
			padding-inline: 6px;
		}
		.topbar__center,
		.collaborators,
		.connection-status,
		.file-mark {
			display: none;
		}
		:global(.mobile-layers-toggle) {
			display: grid;
			width: 40px;
			height: 40px;
		}
		.file-trigger__name {
			max-width: 42vw;
		}
		.resume-button {
			padding: 6px;
		}
		:global(.mobile-layer-backdrop) {
			position: fixed;
			z-index: 80;
			inset: 46px 0 0;
			display: block;
			width: 100%;
			padding: 0;
			border: 0;
			background: rgb(0 0 0 / 25%);
		}
		:global(.mobile-layers) {
			position: fixed;
			z-index: 90;
			top: 46px;
			bottom: 0;
			left: 0;
			display: block;
			width: min(300px, 86vw);
			padding-bottom: 18px;
			border: 0;
			overflow: auto;
			background: #f8f8f8;
			box-shadow: 6px 0 24px rgb(0 0 0 / 18%);
		}
		:global(.mobile-layers .layer-row) {
			padding: 10px 14px;
		}
		:global(.mobile-layers-close) {
			display: grid;
			width: 40px;
			height: 40px;
			border: 0;
			place-items: center;
			border-radius: 4px;
			background: transparent;
			color: #666;
		}
	}
</style>
