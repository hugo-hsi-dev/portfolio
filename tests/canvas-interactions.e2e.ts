import { expect, test } from '@playwright/test';

import { openPortfolio, PROFILE_FRAME, resetBoard } from './helpers/portfolio';

test.describe('canvas interactions', () => {
	test.use({ viewport: { width: 1440, height: 900 } });

	test('zooms, fits, selects, and keyboard-nudges a frame', async ({ page, request }) => {
		await resetBoard(request);
		try {
			await openPortfolio(page);
			await expect(page.locator('[data-connection-state="open"]')).toBeVisible();
			const profile = page.locator(PROFILE_FRAME);
			const initialBox = await profile.boundingBox();
			expect(initialBox).not.toBeNull();

			await page.getByRole('button', { name: 'Zoom in' }).click();
			await expect
				.poll(async () => (await profile.boundingBox())?.width ?? 0)
				.toBeGreaterThan(initialBox?.width ?? 0);

			await page.getByRole('button', { name: 'Fit all' }).click();
			await expect(profile).toBeInViewport();
			await profile.click();
			await expect(page.getByRole('button', { name: 'Fit selection' })).toBeEnabled();

			await page.getByRole('button', { name: 'Fit selection' }).click();
			await expect(profile).toBeInViewport();
			const beforeNudge = await profile.evaluate((element) => element.style.transform);
			const canvas = page.locator('[data-canvas-viewport]');
			await canvas.focus();
			await expect(canvas).toBeFocused();
			await page.keyboard.press('ArrowRight');
			await expect
				.poll(async () => profile.evaluate((element) => element.style.transform))
				.not.toBe(beforeNudge);
		} finally {
			await resetBoard(request);
		}
	});
});
