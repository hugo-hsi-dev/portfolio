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
			'MineCentral',
			'Me Save Money'
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

		await expect(
			page.getByRole('heading', { level: 3, name: 'Full Stack Developer (Contractor)' })
		).toBeVisible();
		await expect(page.getByText('Oct 2025 - Present')).toBeVisible();
		await expect(
			page.getByRole('heading', { level: 3, name: 'Design Production Intern' })
		).toBeVisible();
		await expect(page.getByText('2022 - 2023')).toBeVisible();
		await expect(
			page.getByRole('heading', { level: 3, name: 'Full Stack Web Development Bootcamp' })
		).toBeVisible();
		await expect(page.getByText('May 2024', { exact: true })).toBeVisible();
		await expect(page.getByText('May 2023', { exact: true })).toBeVisible();

		expect(
			await page.evaluate(
				() => document.documentElement.scrollWidth - document.documentElement.clientWidth
			)
		).toBe(0);
		expect(consoleErrors).toEqual([]);
	});

	test('provides a keyboard-accessible skip link', async ({ page }) => {
		await page.goto('/');
		const skipLink = page.getByRole('link', { name: 'Skip to content' });
		expect(await skipLink.evaluate((element) => getComputedStyle(element).transitionDuration)).toBe(
			'0s'
		);

		await page.keyboard.press('Tab');
		await expect(skipLink).toBeFocused();
		await page.keyboard.press('Enter');
		await expect(page.locator('#main')).toBeFocused();
	});

	test('keeps the primary hero action immediately available', async ({ page }) => {
		await page.goto('/');
		const actions = page.locator('.hero-actions');
		const resumeLink = page.getByRole('link', { name: 'Download resume' });
		const typewriterText = page.locator('.typewriter-text');
		const untypedCharacter = page.locator('.untyped-character').first();
		const cursorAnchor = page
			.locator('.typewriter-text.typing-not-started, .cursor-anchor')
			.first();

		await expect(actions).toBeVisible();
		await expect(resumeLink).toHaveAttribute('href', '/media/resume/resume_hugo-hsi.pdf');
		await expect(resumeLink).toHaveAttribute('download', 'resume_hugo-hsi.pdf');
		expect(await resumeLink.getAttribute('target')).toBeNull();
		expect(await actions.evaluate((element) => getComputedStyle(element).animationName)).toBe(
			'none'
		);
		expect(await actions.evaluate((element) => getComputedStyle(element).opacity)).toBe('1');
		expect(await typewriterText.textContent()).toBe(
			'Engineering products from design to database.'
		);
		expect(await untypedCharacter.evaluate((element) => getComputedStyle(element).visibility)).toBe(
			'hidden'
		);
		expect(
			await cursorAnchor.evaluate((element) => {
				const pseudo = element.classList.contains('typewriter-text') ? '::before' : '::after';
				return getComputedStyle(element, pseudo).animationName;
			})
		).toContain('cursor-blink');
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

		const typewriterText = page.locator('.typewriter-text');
		await expect(typewriterText).toHaveText('Engineering products from design to database.');
		expect(await page.locator('.untyped-character').count()).toBe(0);
		expect(
			await page
				.locator('.cursor-anchor')
				.evaluate((element) => getComputedStyle(element, '::after').animationName)
		).toBe('none');
		expect(
			await page.locator('.progress').evaluate((element) => getComputedStyle(element).display)
		).toBe('none');

		const socialLink = page.getByRole('link', { name: 'GitHub profile' });
		await socialLink.hover();
		expect(await socialLink.evaluate((element) => getComputedStyle(element).transform)).toBe(
			'none'
		);

		const primaryAction = page.getByRole('link', { name: 'View my work' });
		await primaryAction.hover();
		expect(
			await primaryAction.evaluate((element) => getComputedStyle(element, '::before').display)
		).toBe('none');
	});
});
