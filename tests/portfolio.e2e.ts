import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
	await page.goto('/');
});

test('presents a focused one-page hiring narrative', async ({ page }) => {
	await expect(
		page.getByRole('heading', {
			level: 1,
			name: 'Design taught me to read systems. Engineering taught me to rewrite them.'
		})
	).toBeVisible();
	await expect(
		page.getByRole('heading', { level: 2, name: 'Clear on the surface. Coherent underneath.' })
	).toBeVisible();
	await expect(page.locator('.system-record')).toHaveCount(3);
	await expect(page.locator('.product-record')).toHaveCount(2);
	await expect(page.getByRole('link', { name: 'Visit site' })).toHaveAttribute(
		'href',
		'https://minecentral.net'
	);
	await expect(page.getByRole('link', { name: 'Email Hugo' })).toHaveAttribute(
		'href',
		'mailto:hugohsidev@gmail.com'
	);
});

test('has no automatically detectable accessibility violations', async ({ page }) => {
	const results = await new AxeBuilder({ page }).analyze();

	expect(results.violations).toEqual([]);
});

test('does not overflow the viewport horizontally', async ({ page }) => {
	const overflows = await page.evaluate(
		() => document.documentElement.scrollWidth > document.documentElement.clientWidth
	);

	expect(overflows).toBe(false);
});
