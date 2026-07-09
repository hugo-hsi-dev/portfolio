import { expect, test } from '@playwright/test';

test.describe('portfolio homepage', () => {
	test.use({ viewport: { width: 1440, height: 900 } });

	test('renders verified content, media, and external links', async ({ page }) => {
		const consoleErrors: string[] = [];
		page.on('console', (message) => {
			if (message.type() === 'error') consoleErrors.push(message.text());
		});

		await page.goto('/');
		await expect(
			page.getByRole('heading', {
				level: 1,
				name: 'Engineering products from design to database.'
			})
		).toBeVisible();

		await page.getByRole('link', { name: 'View my work' }).click();
		await expect(page).toHaveURL(/#projects$/);
		await expect(page.getByRole('heading', { level: 2, name: 'Selected Work' })).toBeInViewport();

		await expect(page.locator('#projects article h3')).toHaveText([
			'National Medal of Honor Museum',
			'1st Avenue Advisors',
			'MineCentral'
		]);

		const images = page.locator('#projects img');
		await expect(images).toHaveCount(3);
		for (const image of await images.all()) {
			expect(
				await image.evaluate((element: HTMLImageElement) => element.naturalWidth)
			).toBeGreaterThan(0);
		}

		const projectLinks = page.locator('#projects article > a');
		await expect(projectLinks).toHaveCount(3);
		for (const link of await projectLinks.all()) {
			await expect(link).toHaveAttribute('target', '_blank');
			await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
		}

		expect(
			await page.evaluate(
				() => document.documentElement.scrollWidth - document.documentElement.clientWidth
			)
		).toBe(0);
		expect(consoleErrors).toEqual([]);
	});

	test('provides a keyboard-accessible skip link', async ({ page }) => {
		await page.goto('/');
		await page.keyboard.press('Tab');
		await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
		await page.keyboard.press('Enter');
		await expect(page.locator('#main')).toBeFocused();
	});
});

test.describe('mobile portfolio', () => {
	test.use({ viewport: { width: 390, height: 844 } });

	test('stacks content and keeps the next section visible', async ({ page }) => {
		await page.goto('/');

		const selectedWork = page.getByRole('heading', { level: 2, name: 'Selected Work' });
		const selectedWorkBox = await selectedWork.boundingBox();
		expect(selectedWorkBox).not.toBeNull();
		expect(selectedWorkBox?.y).toBeLessThanOrEqual(844);

		await selectedWork.scrollIntoViewIfNeeded();
		const firstImage = await page.locator('#projects .project-image').first().boundingBox();
		const firstCopy = await page.locator('#projects .project-copy').first().boundingBox();
		expect(firstImage).not.toBeNull();
		expect(firstCopy?.y).toBeGreaterThanOrEqual((firstImage?.y ?? 0) + (firstImage?.height ?? 0));

		expect(
			await page.evaluate(
				() => document.documentElement.scrollWidth - document.documentElement.clientWidth
			)
		).toBe(0);
	});
});

test.describe('reduced motion', () => {
	test.use({ viewport: { width: 1280, height: 800 } });

	test('shows content immediately and removes progress animation', async ({ page }) => {
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.goto('/');

		const character = page.locator('.character').first();
		expect(await character.evaluate((element) => getComputedStyle(element).animationName)).toBe(
			'none'
		);
		expect(await character.evaluate((element) => getComputedStyle(element).opacity)).toBe('1');
		expect(
			await page.locator('.progress').evaluate((element) => getComputedStyle(element).display)
		).toBe('none');
	});
});
