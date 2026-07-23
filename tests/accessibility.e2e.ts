import { expect, test } from '@playwright/test';

import { expectNoSeriousAccessibilityViolations, openPortfolio } from './helpers/portfolio';

test.describe('accessible browse mode', () => {
	test.use({ viewport: { width: 1440, height: 900 } });

	test('exposes portfolio content in a dialog and passes an axe audit', async ({ page }) => {
		await openPortfolio(page);
		await page.getByRole('button', { name: 'Browse portfolio' }).click();

		const browseDialog = page.getByRole('dialog', { name: 'Browse portfolio' });
		await expect(browseDialog).toBeVisible();
		await expect(
			browseDialog.getByRole('heading', { name: 'National Medal of Honor Museum' })
		).toBeVisible();
		await expect(browseDialog.getByRole('heading', { name: 'Columbia University' })).toBeVisible();
		await expectNoSeriousAccessibilityViolations(page);

		await page.keyboard.press('Escape');
		await expect(browseDialog).toBeHidden();
	});
});
