<script lang="ts">
	import { Dialog } from 'bits-ui';

	import type { PortfolioBoardController } from '../board-controller.svelte';

	let { controller }: { controller: PortfolioBoardController } = $props();
</script>

<Dialog.Root
	bind:open={controller.resetDialogOpen}
	onOpenChange={controller.onResetDialogOpenChange}
>
	<Dialog.Portal>
		<Dialog.Overlay class="dialog-overlay" />
		<Dialog.Content class="reset-dialog">
			<Dialog.Title>Reset board</Dialog.Title>
			<Dialog.Description>
				Restore every frame to its original position. Everyone on the canvas will see the reset.
			</Dialog.Description>
			<label for="owner-key">Owner key</label>
			<input
				id="owner-key"
				type="password"
				autocomplete="off"
				bind:value={controller.ownerKey}
				aria-invalid={Boolean(controller.resetError)}
				aria-describedby={controller.resetError ? 'reset-error' : undefined}
			/>
			{#if controller.resetError}
				<p class="reset-error" id="reset-error" role="alert">{controller.resetError}</p>
			{/if}
			<div class="dialog-actions">
				<Dialog.Close class="secondary-button">Cancel</Dialog.Close>
				<button
					class="danger-button"
					type="button"
					disabled={!controller.ownerKey || controller.resetPending}
					onclick={controller.resetBoard}
					>{controller.resetPending ? 'Resetting…' : 'Reset board'}</button
				>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

<style>
	:global(.reset-dialog) {
		position: fixed;
		z-index: 160;
		top: 50%;
		left: 50%;
		width: min(420px, calc(100vw - 28px));
		padding: 25px;
		border: 0;
		border-radius: 7px;
		background: white;
		color: #292929;
		box-shadow: 0 18px 60px rgb(0 0 0 / 25%);
		transform: translate(-50%, -50%);
	}
	:global(.reset-dialog h2) {
		margin: 0;
		font-size: 16px;
	}
	:global(.reset-dialog > p) {
		margin: 8px 0 20px;
		color: #6b6b6b;
		font-size: 12px;
		line-height: 1.5;
	}
	:global(.reset-dialog label) {
		display: block;
		margin-bottom: 6px;
		font-size: 11px;
		font-weight: 600;
	}
	:global(.reset-dialog input) {
		width: 100%;
		height: 36px;
		padding: 0 10px;
		border: 1px solid #bbb;
		border-radius: 4px;
	}
	.reset-error {
		color: #ba2929 !important;
	}
	.dialog-actions {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
		margin-top: 22px;
	}
	:global(.secondary-button),
	.danger-button {
		padding: 8px 12px;
		border: 0;
		border-radius: 4px;
		font-size: 11px;
		font-weight: 600;
	}
	:global(.secondary-button) {
		background: #eee;
		color: #333;
	}
	.danger-button {
		background: #c23b3b;
		color: white;
	}
	.danger-button:disabled {
		opacity: 0.45;
	}
</style>
