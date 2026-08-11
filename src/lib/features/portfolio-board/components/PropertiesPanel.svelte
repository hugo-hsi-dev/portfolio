<script lang="ts">
	import { ChevronLeft, ChevronRight, Eye, EyeOff, Lock, Unlock } from '@lucide/svelte';

	import type { PortfolioBoardController } from '../board-controller.svelte';

	let { controller }: { controller: PortfolioBoardController } = $props();

	const selectionLabel = $derived(
		controller.selectedFrameIds.length === 0
			? 'Nothing selected'
			: controller.selectedFrameIds.length === 1
				? '1 frame selected'
				: `${controller.selectedFrameIds.length} frames selected`
	);
	const selectionSignature = $derived(controller.selectedFrameIds.join(','));
	let activeAxis = $state<'x' | 'y' | null>(null);
	let draftSelectionSignature = $state('');
	let draftValue = $state('');

	function formatCoordinate(value: number): string {
		return String(value);
	}

	function coordinateValue(axis: 'x' | 'y', actualValue: number): string {
		return activeAxis === axis && draftSelectionSignature === selectionSignature
			? draftValue
			: formatCoordinate(actualValue);
	}

	function beginAxisEdit(axis: 'x' | 'y', event: FocusEvent): void {
		activeAxis = axis;
		draftSelectionSignature = selectionSignature;
		draftValue = (event.currentTarget as HTMLInputElement).value;
	}

	function updateAxisDraft(event: Event): void {
		draftValue = (event.currentTarget as HTMLInputElement).value;
	}

	function reconcileAxisInput(axis: 'x' | 'y', input: HTMLInputElement): void {
		const bounds = controller.selectionBounds;
		if (bounds) input.value = formatCoordinate(bounds[axis]);
	}

	function commitAxis(axis: 'x' | 'y', event: Event): void {
		const input = event.currentTarget as HTMLInputElement;
		const value = input.value.trim() === '' ? Number.NaN : Number(input.value);
		activeAxis = null;
		draftSelectionSignature = '';
		draftValue = '';
		if (Number.isFinite(value)) controller.setSelectionAxis(axis, value);
		reconcileAxisInput(axis, input);
	}

	function handleAxisKeydown(axis: 'x' | 'y', event: KeyboardEvent): void {
		if (event.key !== 'Enter') return;
		event.preventDefault();
		commitAxis(axis, event);
	}
</script>

<aside
	class={['properties-panel', !controller.propertiesOpen && 'is-collapsed']}
	aria-label="Design properties"
>
	<header class="panel-header">
		{#if controller.propertiesOpen}<strong>Design</strong>{/if}
		<button
			type="button"
			aria-label={controller.propertiesOpen ? 'Collapse properties' : 'Expand properties'}
			aria-expanded={controller.propertiesOpen}
			onclick={() => (controller.propertiesOpen = !controller.propertiesOpen)}
		>
			{#if controller.propertiesOpen}<ChevronRight size={15} />{:else}<ChevronLeft size={15} />{/if}
		</button>
	</header>

	{#if controller.propertiesOpen}
		<div class="panel-body">
			<section class="selection-heading" aria-labelledby="selection-heading">
				<div>
					<p class="eyebrow" id="selection-heading">Selection</p>
					<strong>{selectionLabel}</strong>
				</div>
				{#if controller.selectedFrameIds.length > 0}
					<span>{controller.selectedFrameIds.length > 1 ? 'MULTI' : 'FRAME'}</span>
				{/if}
			</section>

			{#if controller.selectionBounds}
				{@const bounds = controller.selectionBounds}
				<section class="property-section" aria-labelledby="position-heading">
					<h2 id="position-heading">Position and size</h2>
					<div class="field-grid">
						<label>
							<span>X</span>
							<input
								type="number"
								step="any"
								value={coordinateValue('x', bounds.x)}
								disabled={!controller.editingReady || controller.selectionAllLocked}
								onfocus={(event) => beginAxisEdit('x', event)}
								oninput={updateAxisDraft}
								onblur={(event) => commitAxis('x', event)}
								onkeydown={(event) => handleAxisKeydown('x', event)}
							/>
						</label>
						<label>
							<span>Y</span>
							<input
								type="number"
								step="any"
								value={coordinateValue('y', bounds.y)}
								disabled={!controller.editingReady || controller.selectionAllLocked}
								onfocus={(event) => beginAxisEdit('y', event)}
								oninput={updateAxisDraft}
								onblur={(event) => commitAxis('y', event)}
								onkeydown={(event) => handleAxisKeydown('y', event)}
							/>
						</label>
						<label>
							<span>W</span>
							<input
								type="number"
								value={Math.round(bounds.width)}
								readonly
								aria-label="Selection width"
							/>
						</label>
						<label>
							<span>H</span>
							<input
								type="number"
								value={Math.round(bounds.height)}
								readonly
								aria-label="Selection height"
							/>
						</label>
					</div>
					<p class="section-note">Frame dimensions are fixed to preserve the portfolio layout.</p>
				</section>

				<section class="property-section" aria-labelledby="align-heading">
					<h2 id="align-heading">Align</h2>
					<div class="icon-button-grid" role="group" aria-label="Alignment">
						{#each ['left', 'center', 'right', 'top', 'middle', 'bottom'] as alignment (alignment)}
							<button
								type="button"
								aria-label={`Align ${alignment}`}
								title={`Align ${alignment}`}
								disabled={controller.selectedFrameIds.length < 2 || !controller.editingReady}
								onclick={() =>
									controller.alignSelection(
										alignment as 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'
									)}
							>
								<span class={`align-symbol is-${alignment}`} aria-hidden="true"><i></i><i></i></span
								>
							</button>
						{/each}
					</div>
					<div class="distribution-row">
						<button
							type="button"
							disabled={controller.selectedFrameIds.length < 3 || !controller.editingReady}
							onclick={() => controller.distributeSelection('horizontal')}
							>Distribute horizontal</button
						>
						<button
							type="button"
							disabled={controller.selectedFrameIds.length < 3 || !controller.editingReady}
							onclick={() => controller.distributeSelection('vertical')}>Distribute vertical</button
						>
					</div>
				</section>

				<section class="property-section" aria-labelledby="layer-heading">
					<h2 id="layer-heading">Layer</h2>
					<div class="metadata-actions">
						<button
							type="button"
							disabled={!controller.editingReady}
							onclick={controller.toggleSelectionVisibility}
						>
							{#if controller.selectionAllVisible}<Eye size={14} /> Hide{:else}<EyeOff size={14} /> Show{/if}
						</button>
						<button
							type="button"
							disabled={!controller.editingReady}
							onclick={controller.toggleSelectionLock}
						>
							{#if controller.selectionAllLocked}<Unlock size={14} /> Unlock{:else}<Lock
									size={14}
								/> Lock{/if}
						</button>
					</div>
				</section>

				{#if controller.selectedFrame}
					<section class="property-section content-section" aria-labelledby="content-heading">
						<h2 id="content-heading">Portfolio content</h2>
						<strong>{controller.selectedFrame.title}</strong>
						<p>{controller.selectedFrame.kind} · source controlled</p>
					</section>
				{/if}
			{:else}
				<section class="empty-selection">
					<div class="page-chip" aria-hidden="true">P</div>
					<h2>Portfolio canvas</h2>
					<p>Select a frame or drag across the canvas to inspect and arrange Hugo’s portfolio.</p>
					<dl>
						<div>
							<dt>Frames</dt>
							<dd>{controller.visibleFrames.length}</dd>
						</div>
						<div>
							<dt>Page</dt>
							<dd>Portfolio</dd>
						</div>
					</dl>
				</section>
			{/if}
		</div>
	{/if}
</aside>

<style>
	.properties-panel {
		position: relative;
		z-index: 25;
		flex: 0 0 256px;
		width: 256px;
		height: 100%;
		border-left: 1px solid #d5d7da;
		background: #f8f8f8;
		color: #2b2b2b;
		font-size: 11px;
	}
	.properties-panel.is-collapsed {
		flex-basis: 38px;
		width: 38px;
	}
	.panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 40px;
		padding: 0 8px 0 14px;
		border-bottom: 1px solid #dddddf;
		background: #fbfbfb;
	}
	.is-collapsed .panel-header {
		justify-content: center;
		padding: 0;
	}
	.panel-header strong {
		font-size: 11px;
		font-weight: 600;
	}
	.panel-header button {
		display: grid;
		width: 28px;
		height: 28px;
		padding: 0;
		border: 0;
		border-radius: 4px;
		background: transparent;
		color: #676767;
		place-items: center;
	}
	.panel-header button:hover {
		background: #ececee;
	}
	.panel-body {
		height: calc(100% - 40px);
		overflow: auto;
	}
	.selection-heading {
		display: flex;
		align-items: center;
		justify-content: space-between;
		min-height: 66px;
		padding: 12px 14px;
		border-bottom: 1px solid #dedee0;
	}
	.selection-heading strong {
		display: block;
		margin-top: 2px;
		font-size: 12px;
		font-weight: 500;
	}
	.selection-heading > span {
		padding: 3px 5px;
		border: 1px solid #d5d5d7;
		border-radius: 3px;
		color: #616161;
		font-size: 8px;
		font-weight: 600;
		letter-spacing: 0.06em;
	}
	.eyebrow {
		margin: 0;
		color: #626262;
		font-size: 9px;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}
	.property-section {
		padding: 13px 14px 14px;
		border-bottom: 1px solid #dedee0;
	}
	.property-section h2,
	.empty-selection h2 {
		margin: 0 0 10px;
		font-size: 11px;
		font-weight: 600;
	}
	.field-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 6px;
	}
	.field-grid label {
		display: flex;
		align-items: center;
		height: 30px;
		border: 1px solid transparent;
		border-radius: 4px;
		background: #ececee;
		color: #5d5d5d;
	}
	.field-grid label:focus-within {
		border-color: var(--figma-blue);
		background: white;
	}
	.field-grid label > span {
		width: 25px;
		text-align: center;
	}
	.field-grid input {
		width: calc(100% - 25px);
		height: 100%;
		padding: 0 5px 0 0;
		border: 0;
		outline: 0;
		background: transparent;
		color: #333;
		font-size: 11px;
		font-variant-numeric: tabular-nums;
	}
	.field-grid input:disabled,
	.field-grid input[readonly] {
		color: #555;
	}
	.section-note {
		margin: 8px 0 0;
		color: #656565;
		font-size: 9px;
		line-height: 1.35;
	}
	.icon-button-grid {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 2px;
	}
	.icon-button-grid button {
		display: grid;
		height: 28px;
		padding: 0;
		border: 0;
		border-radius: 4px;
		background: transparent;
		place-items: center;
	}
	.icon-button-grid button:hover:not(:disabled),
	.metadata-actions button:hover:not(:disabled),
	.distribution-row button:hover:not(:disabled) {
		background: #e6e6e8;
	}
	button:disabled {
		opacity: 0.32;
	}
	.align-symbol {
		position: relative;
		display: block;
		width: 16px;
		height: 16px;
	}
	.align-symbol::before {
		position: absolute;
		background: #555;
		content: '';
	}
	.align-symbol i {
		position: absolute;
		display: block;
		background: #888;
	}
	.align-symbol.is-left::before,
	.align-symbol.is-center::before,
	.align-symbol.is-right::before {
		top: 1px;
		bottom: 1px;
		width: 1px;
	}
	.align-symbol.is-left::before {
		left: 2px;
	}
	.align-symbol.is-center::before {
		left: 8px;
	}
	.align-symbol.is-right::before {
		right: 2px;
	}
	.align-symbol.is-left i,
	.align-symbol.is-center i,
	.align-symbol.is-right i {
		left: 3px;
		width: 10px;
		height: 2px;
	}
	.align-symbol.is-left i:first-child,
	.align-symbol.is-center i:first-child,
	.align-symbol.is-right i:first-child {
		top: 4px;
	}
	.align-symbol.is-left i:last-child,
	.align-symbol.is-center i:last-child,
	.align-symbol.is-right i:last-child {
		bottom: 4px;
		width: 7px;
	}
	.align-symbol.is-top::before,
	.align-symbol.is-middle::before,
	.align-symbol.is-bottom::before {
		left: 1px;
		right: 1px;
		height: 1px;
	}
	.align-symbol.is-top::before {
		top: 2px;
	}
	.align-symbol.is-middle::before {
		top: 8px;
	}
	.align-symbol.is-bottom::before {
		bottom: 2px;
	}
	.align-symbol.is-top i,
	.align-symbol.is-middle i,
	.align-symbol.is-bottom i {
		top: 3px;
		width: 2px;
		height: 10px;
	}
	.align-symbol.is-top i:first-child,
	.align-symbol.is-middle i:first-child,
	.align-symbol.is-bottom i:first-child {
		left: 4px;
	}
	.align-symbol.is-top i:last-child,
	.align-symbol.is-middle i:last-child,
	.align-symbol.is-bottom i:last-child {
		right: 4px;
		height: 7px;
	}
	.distribution-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 6px;
		margin-top: 8px;
	}
	.distribution-row button,
	.metadata-actions button {
		min-height: 32px;
		padding: 4px 6px;
		border: 0;
		border-radius: 4px;
		background: #ececee;
		color: #555;
		font-size: 9px;
		line-height: 1.2;
	}
	.metadata-actions {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 6px;
	}
	.metadata-actions button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		font-size: 10px;
	}
	.content-section strong {
		display: block;
		font-size: 12px;
		font-weight: 500;
		line-height: 1.3;
	}
	.content-section p {
		margin: 4px 0 0;
		color: #656565;
		text-transform: capitalize;
	}
	.empty-selection {
		padding: 22px 16px;
	}
	.page-chip {
		display: grid;
		width: 30px;
		height: 30px;
		margin-bottom: 13px;
		border-radius: 4px;
		background: #2c2c2c;
		color: white;
		font-size: 11px;
		font-weight: 600;
		place-items: center;
	}
	.empty-selection > p {
		margin: 0;
		color: #656565;
		font-size: 10px;
		line-height: 1.5;
	}
	.empty-selection dl {
		margin: 18px 0 0;
	}
	.empty-selection dl div {
		display: flex;
		justify-content: space-between;
		padding: 8px 0;
		border-top: 1px solid #e2e2e3;
	}
	.empty-selection dt {
		color: #656565;
	}
	.empty-selection dd {
		margin: 0;
	}
	@media (max-width: 900px) {
		.properties-panel {
			display: none;
		}
	}
</style>
