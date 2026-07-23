import AxeBuilder from '@axe-core/playwright';
import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

const PROFILE_FRAME = '[data-frame-id="profile"]';
const PROJECT_FRAME = '[data-frame-id="project-national-medal-of-honor-museum"]';
const RESET_TOKEN = 'playwright-owner-key';

async function openPortfolio(page: Page) {
	await page.goto('/');
	await expect(page.locator(PROFILE_FRAME)).toBeVisible();
}

async function openLayers(page: Page) {
	const layers = page.getByRole('navigation', { name: 'Layers' }).filter({ visible: true });
	if (!(await layers.isVisible())) {
		await page.getByRole('button', { name: 'Toggle layers' }).click();
	}
	await expect(layers).toBeVisible();
	return layers;
}

async function expectNoSeriousAccessibilityViolations(page: Page) {
	const results = await new AxeBuilder({ page }).analyze();
	const seriousViolations = results.violations.filter(({ impact }) =>
		['serious', 'critical'].includes(impact ?? '')
	);
	expect(seriousViolations).toEqual([]);
}

async function resetBoard(request: APIRequestContext) {
	const response = await request.post('/api/board/reset', {
		data: { token: RESET_TOKEN }
	});
	await expect(response).toBeOK();
}

test.describe('interactive portfolio canvas', () => {
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

	test('offers an accessible browse mode and passes an axe audit', async ({ page }) => {
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

test.describe('multiplayer board', () => {
	test('synchronizes cursors and frame positions, persists changes, and supports owner reset', async ({
		browser,
		request
	}) => {
		await resetBoard(request);
		const firstContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
		const secondContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
		const first = await firstContext.newPage();
		const second = await secondContext.newPage();

		try {
			await Promise.all([openPortfolio(first), openPortfolio(second)]);
			await expect(first.locator('[data-connection-state="open"]')).toBeVisible();
			await expect(second.locator('[data-connection-state="open"]')).toBeVisible();

			await first.mouse.move(620, 420);
			await expect(second.locator('[data-peer-cursor] .multiplayer-cursor')).toBeVisible();

			const firstFrame = first.locator(PROFILE_FRAME);
			const secondFrame = second.locator(PROFILE_FRAME);
			const initial = await firstFrame.boundingBox();
			expect(initial).not.toBeNull();
			if (!initial) return;

			await first.mouse.move(initial.x + 40, initial.y + 40);
			await first.mouse.down();
			await first.mouse.move(initial.x + 120, initial.y + 100, { steps: 5 });
			await first.mouse.up();

			await expect
				.poll(async () => (await secondFrame.boundingBox())?.x ?? 0)
				.toBeGreaterThan(initial.x + 40);
			const persistedTransform = await secondFrame.evaluate((element) => element.style.transform);
			await second.reload();
			await expect(second.locator('[data-connection-state="open"]')).toBeVisible();
			await expect
				.poll(async () => secondFrame.evaluate((element) => element.style.transform))
				.toBe(persistedTransform);

			await first.getByRole('button', { name: 'Open file menu' }).click();
			await first.getByRole('menuitem', { name: 'Reset board' }).click();
			const resetDialog = first.getByRole('dialog', { name: 'Reset board' });
			await resetDialog.getByLabel('Owner key').fill('playwright-owner-key');
			await resetDialog.getByRole('button', { name: 'Reset board' }).click();
			await expect(resetDialog).toBeHidden();
			await expect
				.poll(async () => secondFrame.evaluate((element) => element.style.transform))
				.toBe('translate3d(0px, 0px, 0px)');
		} finally {
			try {
				await resetBoard(request);
			} finally {
				await Promise.all([firstContext.close(), secondContext.close()]);
			}
		}
	});
});
