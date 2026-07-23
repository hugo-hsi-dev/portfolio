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
});
