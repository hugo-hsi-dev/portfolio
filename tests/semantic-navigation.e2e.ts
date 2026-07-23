import { expect, test } from '@playwright/test';

import { openLayers, openPortfolio, PROFILE_FRAME, PROJECT_FRAME } from './helpers/portfolio';

test.describe('portfolio content and navigation', () => {
	test.use({ viewport: { width: 1440, height: 900 } });

	test('renders the portfolio as semantic, movable frames', async ({ page }) => {
		const consoleErrors: string[] = [];
		page.on('console', (message) => {
			if (message.type() === 'error') consoleErrors.push(message.text());
		});

		await openPortfolio(page);

		await expect(page.locator('[data-frame-id]')).toHaveCount(11);
		await expect(page.locator(PROFILE_FRAME)).toContainText('Hugo Hsi');
		await expect(page.locator(PROJECT_FRAME)).toContainText('National Medal of Honor Museum');
		await expect(page.locator('[data-frame-id="project-1st-avenue-advisors"]')).toContainText(
			'1st Avenue Advisors'
		);
		await expect(page.locator('[data-frame-id="project-minecentral"]')).toContainText(
			'MineCentral'
		);
		await expect(page.locator('[data-frame-id="project-me-save-money"]')).toContainText(
			'Me Save Money'
		);
		await expect(page.locator('[data-frame-id="experience-praxis-loop"]')).toContainText(
			'Praxis Loop'
		);
		await expect(page.locator('[data-frame-id="education-columbia-university"]')).toContainText(
			'Columbia University'
		);
		await expect(page.locator('[data-frame-id="technologies"]')).toContainText('Technologies');

		const projectLinks = page.locator('[data-frame-id^="project-"] a[target="_blank"]');
		await expect(projectLinks).toHaveCount(3);
		for (const link of await projectLinks.all()) {
			await expect(link).toHaveAttribute('rel', /(noopener|noreferrer)/);
		}

		expect(
			await page.evaluate(
				() => document.documentElement.scrollWidth - document.documentElement.clientWidth
			)
		).toBe(0);
		expect(consoleErrors).toEqual([]);
	});

	test('uses Layers to locate frames anywhere in the world', async ({ page }) => {
		await openPortfolio(page);
		const layers = await openLayers(page);

		await layers.getByRole('button', { name: 'Go to Technologies' }).click();
		await expect(page.locator('[data-frame-id="technologies"]')).toBeInViewport();

		await layers.getByRole('button', { name: 'Go to Hugo Hsi' }).click();
		await expect(page.locator(PROFILE_FRAME)).toBeInViewport();
	});
});
