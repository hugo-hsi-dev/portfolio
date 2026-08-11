import { expect, test } from '@playwright/test';

import { openPortfolio } from './helpers/portfolio';

test.describe('mobile portfolio canvas', () => {
	test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

	test('opens in the complete reading view and returns to the canvas', async ({ page }) => {
		await openPortfolio(page);
		const browseDialog = page.getByRole('dialog', { name: 'Browse portfolio' });
		await expect(browseDialog).toBeVisible();
		await expect(browseDialog.getByRole('heading', { name: 'Hugo Hsi' })).toBeVisible();
		await expect(
			browseDialog.getByRole('heading', { name: 'National Medal of Honor Museum' })
		).toBeVisible();
		await expect(
			browseDialog.getByRole('heading', { name: 'Full Stack Developer (Contractor)' })
		).toBeVisible();
		await expect(browseDialog.getByRole('heading', { name: 'Columbia University' })).toBeVisible();

		for (const target of [
			browseDialog.getByRole('button', { name: 'Close browse mode' }),
			browseDialog.getByRole('link', { name: 'View my work' }),
			browseDialog.getByRole('link', { name: /Download resume/ })
		]) {
			const box = await target.boundingBox();
			expect(box?.width).toBeGreaterThanOrEqual(44);
			expect(box?.height).toBeGreaterThanOrEqual(44);
		}

		await browseDialog.getByRole('button', { name: 'Close browse mode' }).click();
		await expect(browseDialog).toBeHidden();
		await expect(
			page.getByRole('application', { name: 'Interactive portfolio canvas' })
		).toBeVisible();
	});

	test('keeps the editor touch-safe and exposes Layers as a drawer', async ({ page }) => {
		await openPortfolio(page);
		const browseDialog = page.getByRole('dialog', { name: 'Browse portfolio' });
		await expect(browseDialog).toBeVisible();
		await browseDialog.getByRole('button', { name: 'Close browse mode' }).click();

		const primaryControls = [
			['Toggle layers', page.getByRole('button', { name: 'Toggle layers' })],
			['Select tool', page.getByRole('button', { name: 'Select tool' })],
			['Hand tool', page.getByRole('button', { name: 'Hand tool' })],
			[
				'Topbar Browse portfolio',
				page.locator('header').getByRole('button', { name: 'Browse portfolio' })
			],
			[
				'Toolbar Browse portfolio',
				page
					.getByRole('toolbar', { name: 'Canvas tools' })
					.getByRole('button', { name: 'Browse portfolio' })
			],
			['Fit selection', page.getByRole('button', { name: 'Fit selection' })],
			['Fit all', page.getByRole('button', { name: 'Fit all' })]
		] as const;
		for (const [name, control] of primaryControls) {
			const box = await control.boundingBox();
			expect(box?.width, `${name} width`).toBeGreaterThanOrEqual(44);
			expect(box?.height, `${name} height`).toBeGreaterThanOrEqual(44);
		}

		const layers = page.getByRole('navigation', { name: 'Layers' }).filter({ visible: true });
		await expect(layers).toBeHidden();
		await page.getByRole('button', { name: 'Toggle layers' }).click();
		await expect(layers).toBeVisible();
		const destination = layers.getByRole('button', { name: 'Go to MineCentral' });
		const destinationBox = await destination.boundingBox();
		expect(destinationBox?.width).toBeGreaterThanOrEqual(44);
		expect(destinationBox?.height).toBeGreaterThanOrEqual(44);
		await destination.click();
		await expect(layers).toBeHidden();
		await expect(page.locator('[data-frame-id="project-minecentral"]')).toBeInViewport();

		expect(
			await page.evaluate(
				() => document.documentElement.scrollWidth - document.documentElement.clientWidth
			)
		).toBe(0);
	});
});
