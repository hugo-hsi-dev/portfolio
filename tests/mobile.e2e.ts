import { expect, test } from '@playwright/test';

import { openPortfolio } from './helpers/portfolio';

test.describe('mobile portfolio canvas', () => {
	test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

	test('keeps canvas controls touch-safe and exposes Layers as a drawer', async ({ page }) => {
		await openPortfolio(page);
		const layers = page.getByRole('navigation', { name: 'Layers' }).filter({ visible: true });
		await expect(layers).toBeHidden();

		await page.getByRole('button', { name: 'Toggle layers' }).click();
		await expect(layers).toBeVisible();
		await layers.getByRole('button', { name: 'Go to MineCentral' }).click();
		await expect(page.locator('[data-frame-id="project-minecentral"]')).toBeInViewport();

		for (const control of ['Toggle layers', 'Zoom out', 'Zoom in', 'Fit all']) {
			const box = await page.getByRole('button', { name: control }).boundingBox();
			expect(box?.width).toBeGreaterThanOrEqual(40);
			expect(box?.height).toBeGreaterThanOrEqual(40);
		}

		expect(
			await page.evaluate(
				() => document.documentElement.scrollWidth - document.documentElement.clientWidth
			)
		).toBe(0);
	});
});
