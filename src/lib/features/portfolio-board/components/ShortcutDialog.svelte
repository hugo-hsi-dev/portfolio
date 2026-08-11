<script lang="ts">
	import { X } from '@lucide/svelte';
	import { Dialog } from 'bits-ui';

	import type { PortfolioBoardController } from '../board-controller.svelte';

	let { controller }: { controller: PortfolioBoardController } = $props();

	const shortcutGroups = [
		{
			label: 'Tools and view',
			items: [
				['Select tool', 'V'],
				['Hand tool', 'H'],
				['Temporary hand', 'Space'],
				['Fit all', '⇧ 1'],
				['Fit selection', '⇧ 2']
			]
		},
		{
			label: 'Selection',
			items: [
				['Select all visible frames', '⌘ A'],
				['Add to selection', '⇧ Click'],
				['Nudge', 'Arrow'],
				['Nudge by 10', '⇧ Arrow'],
				['Clear selection', 'Esc']
			]
		},
		{
			label: 'Layer and history',
			items: [
				['Undo', '⌘ Z'],
				['Redo', '⇧ ⌘ Z'],
				['Hide or show selection', '⇧ ⌘ H'],
				['Lock or unlock selection', '⇧ ⌘ L']
			]
		}
	] as const;
</script>

<Dialog.Root bind:open={controller.shortcutDialogOpen}>
	<Dialog.Portal>
		<Dialog.Overlay class="shortcuts-overlay" />
		<Dialog.Content class="shortcuts-dialog">
			<header>
				<div>
					<Dialog.Title>Keyboard shortcuts</Dialog.Title>
					<Dialog.Description>Move through Hugo’s portfolio like a design file.</Dialog.Description>
				</div>
				<Dialog.Close aria-label="Close keyboard shortcuts"><X size={17} /></Dialog.Close>
			</header>
			<div class="shortcut-groups">
				{#each shortcutGroups as group (group.label)}
					<section aria-labelledby={`shortcut-${group.label.toLowerCase().replaceAll(' ', '-')}`}>
						<h3 id={`shortcut-${group.label.toLowerCase().replaceAll(' ', '-')}`}>{group.label}</h3>
						<dl>
							{#each group.items as item (item[0])}
								<div>
									<dt>{item[0]}</dt>
									<dd><kbd>{item[1]}</kbd></dd>
								</div>
							{/each}
						</dl>
					</section>
				{/each}
			</div>
			<p class="platform-note">On Windows and Linux, use Ctrl wherever ⌘ is shown.</p>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

<style>
	:global(.shortcuts-overlay) {
		position: fixed;
		z-index: 150;
		inset: 0;
		background: rgb(24 24 24 / 52%);
		backdrop-filter: blur(2px);
	}
	:global(.shortcuts-dialog) {
		position: fixed;
		z-index: 160;
		top: 50%;
		left: 50%;
		width: min(680px, calc(100vw - 28px));
		padding: 0;
		border: 1px solid #3d3d3d;
		border-radius: 8px;
		background: #2c2c2c;
		color: #f4f4f4;
		box-shadow: 0 22px 70px rgb(0 0 0 / 38%);
		transform: translate(-50%, -50%);
	}
	:global(.shortcuts-dialog > header) {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		padding: 20px 22px 17px;
		border-bottom: 1px solid #454545;
	}
	:global(.shortcuts-dialog h2) {
		margin: 0;
		font-size: 15px;
		font-weight: 600;
	}
	:global(.shortcuts-dialog header p) {
		margin: 5px 0 0;
		color: #aaa;
		font-size: 11px;
	}
	:global(.shortcuts-dialog header button) {
		display: grid;
		width: 30px;
		height: 30px;
		padding: 0;
		border: 0;
		border-radius: 4px;
		background: transparent;
		color: #ddd;
		place-items: center;
	}
	:global(.shortcuts-dialog header button:hover) {
		background: #424242;
	}
	.shortcut-groups {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0;
		padding: 20px 22px;
	}
	.shortcut-groups section {
		padding: 0 18px;
		border-left: 1px solid #454545;
	}
	.shortcut-groups section:first-child {
		padding-left: 0;
		border-left: 0;
	}
	.shortcut-groups section:last-child {
		padding-right: 0;
	}
	.shortcut-groups h3 {
		margin: 0 0 11px;
		color: #aaa;
		font-size: 9px;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}
	.shortcut-groups dl {
		margin: 0;
	}
	.shortcut-groups dl div {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		min-height: 30px;
	}
	.shortcut-groups dt {
		color: #ddd;
		font-size: 10px;
		line-height: 1.25;
	}
	.shortcut-groups dd {
		margin: 0;
	}
	.shortcut-groups kbd {
		display: inline-block;
		min-width: 29px;
		padding: 3px 5px;
		border: 1px solid #555;
		border-radius: 4px;
		background: #383838;
		color: white;
		font: inherit;
		font-size: 9px;
		text-align: center;
		white-space: nowrap;
	}
	.platform-note {
		margin: 0;
		padding: 11px 22px 13px;
		border-top: 1px solid #454545;
		color: #999;
		font-size: 9px;
	}
	@media (max-width: 640px) {
		:global(.shortcuts-dialog) {
			max-height: calc(100dvh - 24px);
			overflow: auto;
		}
		.shortcut-groups {
			grid-template-columns: 1fr;
		}
		.shortcut-groups section,
		.shortcut-groups section:first-child,
		.shortcut-groups section:last-child {
			padding: 15px 0;
			border-top: 1px solid #454545;
			border-left: 0;
		}
		.shortcut-groups section:first-child {
			padding-top: 0;
			border-top: 0;
		}
		.shortcut-groups dl div {
			min-height: 38px;
		}
	}
</style>
