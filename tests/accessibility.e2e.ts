import { expect, test } from '@playwright/test';

import { expectNoSeriousAccessibilityViolations, openPortfolio } from './helpers/portfolio';

test.describe('portfolio accessibility', () => {
	test('keeps the desktop editor and Browse mode free of serious axe violations', async ({
		page
	}) => {
		await page.setViewportSize({ width: 1440, height: 900 });
		await openPortfolio(page);
		await expectNoSeriousAccessibilityViolations(page);

		await page
			.getByRole('toolbar', { name: 'Canvas tools' })
			.getByRole('button', { name: 'Browse portfolio' })
			.click();
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

	test('keeps the mobile reading view and canvas free of serious axe violations', async ({
		page
	}) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await openPortfolio(page);
		const browseDialog = page.getByRole('dialog', { name: 'Browse portfolio' });
		await expect(browseDialog).toBeVisible();
		await expectNoSeriousAccessibilityViolations(page);

		await browseDialog.getByRole('button', { name: 'Close browse mode' }).click();
		await expect(browseDialog).toBeHidden();
		await expectNoSeriousAccessibilityViolations(page);
	});
});
