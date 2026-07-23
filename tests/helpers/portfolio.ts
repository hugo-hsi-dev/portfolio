import AxeBuilder from '@axe-core/playwright';
import { expect, type APIRequestContext, type Page } from '@playwright/test';

export const PROFILE_FRAME = '[data-frame-id="profile"]';
export const PROJECT_FRAME = '[data-frame-id="project-national-medal-of-honor-museum"]';

export const RESET_TOKEN = 'playwright-owner-key-0123456789abcdef';

export async function openPortfolio(page: Page) {
	await page.goto('/');
	await expect(page.locator(PROFILE_FRAME)).toBeVisible();
}

export async function openLayers(page: Page) {
	const layers = page.getByRole('navigation', { name: 'Layers' }).filter({ visible: true });
	if (!(await layers.isVisible())) {
		await page.getByRole('button', { name: 'Toggle layers' }).click();
	}
	await expect(layers).toBeVisible();
	return layers;
}

export async function expectNoSeriousAccessibilityViolations(page: Page) {
	const results = await new AxeBuilder({ page }).analyze();
	const seriousViolations = results.violations.filter(({ impact }) =>
		['serious', 'critical'].includes(impact ?? '')
	);
	expect(seriousViolations).toEqual([]);
}

export async function resetBoard(request: APIRequestContext) {
	const response = await request.post('/api/board/reset', {
		data: { token: RESET_TOKEN }
	});
	await expect(response).toBeOK();
}

export async function waitForVisualStability(page: Page) {
	await expect(page.locator('[data-connection-state]')).toHaveAttribute(
		'data-connection-state',
		'open'
	);
	await expect(page.locator('[data-canvas-world]')).toBeVisible();
	await page.evaluate(async () => {
		await document.fonts.ready;
	});
	await page.addStyleTag({
		content: `
			*, *::before, *::after {
				animation-delay: 0s !important;
				animation-duration: 0s !important;
				caret-color: transparent !important;
				transition-delay: 0s !important;
				transition-duration: 0s !important;
			}
		`
	});
}

export function stableScreenshotOptions(page: Page) {
	return {
		animations: 'disabled' as const,
		caret: 'hide' as const,
		mask: [page.locator('[data-connection-state]')],
		maxDiffPixelRatio: 0.01
	};
}
