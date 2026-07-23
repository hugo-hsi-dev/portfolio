import { expect, test } from '@playwright/test';

import { openLayers, openPortfolio } from './helpers/portfolio';

test.describe('reduced motion', () => {
	test.use({ viewport: { width: 1280, height: 800 } });

	test('does not animate camera navigation or collaborator cursors', async ({ browser, page }) => {
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await openPortfolio(page);
		const layers = await openLayers(page);
		await layers.getByRole('button', { name: 'Go to Technologies' }).click();
		await expect(page.locator('[data-frame-id="technologies"]')).toBeInViewport();

		expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(
			true
		);
		expect(
			await page
				.locator('[data-canvas-world]')
				.evaluate((element) => Number.parseFloat(getComputedStyle(element).transitionDuration))
		).toBeLessThanOrEqual(0.001);

		const peerContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
		try {
			const peerPage = await peerContext.newPage();
			await openPortfolio(peerPage);
			await expect(page.locator('[data-connection-state="open"]')).toBeVisible();
			await expect(peerPage.locator('[data-connection-state="open"]')).toBeVisible();
			await peerPage.mouse.move(620, 420);
			const cursor = page.locator('[data-peer-cursor] .multiplayer-cursor');
			await expect(cursor).toBeVisible();
			expect(
				await cursor.evaluate((element) =>
					Number.parseFloat(getComputedStyle(element).transitionDuration)
				)
			).toBeLessThanOrEqual(0.001);
		} finally {
			await peerContext.close();
		}
	});
});
