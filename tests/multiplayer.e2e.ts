import { expect, test } from '@playwright/test';

import { openPortfolio, PROFILE_FRAME, resetBoard, RESET_TOKEN } from './helpers/portfolio';

test.describe('multiplayer board', () => {
	test('synchronizes cursors and frame positions, persists changes, and supports owner reset', async ({
		browser,
		request
	}) => {
		await resetBoard(request);
		const firstContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
		const secondContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
		const first = await firstContext.newPage();
		const second = await secondContext.newPage();

		try {
			await Promise.all([openPortfolio(first), openPortfolio(second)]);
			await expect(first.locator('[data-connection-state="open"]')).toBeVisible();
			await expect(second.locator('[data-connection-state="open"]')).toBeVisible();

			await first.mouse.move(620, 420);
			await expect(second.locator('[data-peer-cursor] .multiplayer-cursor')).toBeVisible();

			const firstFrame = first.locator(PROFILE_FRAME);
			const secondFrame = second.locator(PROFILE_FRAME);
			const initial = await firstFrame.boundingBox();
			expect(initial).not.toBeNull();
			if (!initial) return;

			await first.mouse.move(initial.x + 40, initial.y + 40);
			await first.mouse.down();
			await first.mouse.move(initial.x + 120, initial.y + 100, { steps: 5 });
			await first.mouse.up();

			await expect
				.poll(async () => (await secondFrame.boundingBox())?.x ?? 0)
				.toBeGreaterThan(initial.x + 40);
			const persistedTransform = await secondFrame.evaluate((element) => element.style.transform);
			await second.reload();
			await expect(second.locator('[data-connection-state="open"]')).toBeVisible();
			await expect
				.poll(async () => secondFrame.evaluate((element) => element.style.transform))
				.toBe(persistedTransform);

			await first.getByRole('button', { name: 'Open file menu' }).click();
			await first.getByRole('menuitem', { name: 'Reset board' }).click();
			const resetDialog = first.getByRole('dialog', { name: 'Reset board' });
			await resetDialog.getByLabel('Owner key').fill(RESET_TOKEN);
			await resetDialog.getByRole('button', { name: 'Reset board' }).click();
			await expect(resetDialog).toBeHidden();
			await expect
				.poll(async () => secondFrame.evaluate((element) => element.style.transform))
				.toBe('translate3d(0px, 0px, 0px)');
		} finally {
			try {
				await resetBoard(request);
			} finally {
				await Promise.all([firstContext.close(), secondContext.close()]);
			}
		}
	});

	test('synchronizes layer visibility and locking and supports collaborator following', async ({
		browser,
		request
	}) => {
		await resetBoard(request);
		const firstContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
		const secondContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
		const first = await firstContext.newPage();
		const second = await secondContext.newPage();

		try {
			await Promise.all([openPortfolio(first), openPortfolio(second)]);
			await expect(first.locator('[data-connection-state="open"]')).toBeVisible();
			await expect(second.locator('[data-connection-state="open"]')).toBeVisible();

			const firstContactLayer = first.getByRole('group', { name: 'Contact layer' });
			await firstContactLayer.hover();
			await firstContactLayer.getByRole('button', { name: 'Hide Contact' }).click();
			await expect(second.locator('[data-frame-id="contact"]')).toHaveCount(0);
			await expect(second.getByRole('button', { name: 'Show Contact' })).toBeAttached();

			await second.reload();
			await expect(second.locator('[data-connection-state="open"]')).toBeVisible();
			await expect(second.locator('[data-frame-id="contact"]')).toHaveCount(0);
			await firstContactLayer.hover();
			await firstContactLayer.getByRole('button', { name: 'Show Contact' }).click();
			await expect(second.locator('[data-frame-id="contact"]')).toHaveCount(1);

			const firstProfileLayer = first.getByRole('group', { name: 'Hugo Hsi layer' });
			await firstProfileLayer.hover();
			await firstProfileLayer.getByRole('button', { name: 'Lock Hugo Hsi' }).click();
			await expect(second.getByRole('button', { name: 'Unlock Hugo Hsi' })).toBeAttached();
			const lockedFrame = second.locator(PROFILE_FRAME);
			const lockedBefore = await lockedFrame.boundingBox();
			expect(lockedBefore).not.toBeNull();
			if (!lockedBefore) return;
			await second.mouse.move(lockedBefore.x + 40, lockedBefore.y + 40);
			await second.mouse.down();
			await second.mouse.move(lockedBefore.x + 130, lockedBefore.y + 100, { steps: 4 });
			await second.mouse.up();
			await expect
				.poll(async () => lockedFrame.evaluate((element) => element.style.transform))
				.toBe('translate3d(0px, 0px, 0px)');
			await firstProfileLayer.hover();
			await firstProfileLayer.getByRole('button', { name: 'Unlock Hugo Hsi' }).click();

			await second.mouse.move(640, 430);
			const followButton = first.locator('button[aria-label^="Follow Guest"]').first();
			await expect(followButton).toBeVisible();
			await followButton.click();
			const followStatus = first.getByRole('status').filter({ hasText: /Following Guest/ });
			await expect(followStatus).toBeVisible();
			await first.locator('[data-canvas-viewport]').hover({ position: { x: 360, y: 300 } });
			await first.mouse.wheel(0, 80);
			await expect(followStatus).toBeHidden();
		} finally {
			try {
				await resetBoard(request);
			} finally {
				await Promise.all([firstContext.close(), secondContext.close()]);
			}
		}
	});
});
