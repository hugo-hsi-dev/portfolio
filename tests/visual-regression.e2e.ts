import { expect, test } from '@playwright/test';

import {
	openPortfolio,
	resetBoard,
	stableScreenshotOptions,
	waitForVisualStability
} from './helpers/portfolio';

test.describe('portfolio visual regression', () => {
	test.describe('desktop', () => {
		test.use({ viewport: { width: 1440, height: 900 } });

		test('matches the initial canvas and Browse mode', async ({ page, request }) => {
			await resetBoard(request);
			try {
				await openPortfolio(page);
				await waitForVisualStability(page);

				await expect(page).toHaveScreenshot(
					'desktop-initial-canvas.png',
					stableScreenshotOptions(page)
				);

				await page.getByRole('button', { name: 'Browse portfolio' }).click();
				await expect(page.getByRole('dialog', { name: 'Browse portfolio' })).toBeVisible();
				await expect(page).toHaveScreenshot(
					'desktop-browse-mode.png',
					stableScreenshotOptions(page)
				);
			} finally {
				await resetBoard(request);
			}
		});
	});

	test.describe('mobile', () => {
		test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

		test('matches the initial canvas and Browse mode', async ({ page, request }) => {
			await resetBoard(request);
			try {
				await openPortfolio(page);
				await waitForVisualStability(page);

				await expect(page).toHaveScreenshot(
					'mobile-initial-canvas.png',
					stableScreenshotOptions(page)
				);

				await page.getByRole('button', { name: 'Browse portfolio' }).click();
				await expect(page.getByRole('dialog', { name: 'Browse portfolio' })).toBeVisible();
				await expect(page).toHaveScreenshot(
					'mobile-browse-mode.png',
					stableScreenshotOptions(page)
				);
			} finally {
				await resetBoard(request);
			}
		});
	});
});
