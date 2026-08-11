import { expect, type Locator, test } from '@playwright/test';

import { openPortfolio, PROFILE_FRAME, PROJECT_FRAME, resetBoard } from './helpers/portfolio';

const AVENUE_FRAME = '[data-frame-id="project-1st-avenue-advisors"]';

async function worldPosition(frame: Locator) {
	return frame.evaluate((element) => {
		const transform = (element as HTMLElement).style.transform;
		const match = /translate3d\((-?[\d.]+)px,\s*(-?[\d.]+)px/.exec(transform);
		if (!match) throw new Error(`Could not read frame position from: ${transform}`);
		return { x: Number(match[1]), y: Number(match[2]) };
	});
}

test.describe('canvas interactions', () => {
	test.use({ viewport: { width: 1440, height: 900 } });

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
			const fitSelectionBox = await profile.boundingBox();
			expect(fitSelectionBox).not.toBeNull();
			const beforeNudge = await worldPosition(profile);
			const canvas = page.locator('[data-canvas-viewport]');
			await canvas.focus();
			await expect(canvas).toBeFocused();
			await page.keyboard.press('Shift+Digit1');
			await expect
				.poll(async () => (await profile.boundingBox())?.width ?? 0)
				.toBeLessThan(fitSelectionBox?.width ?? 0);
			const fitAllBox = await profile.boundingBox();
			await page.keyboard.press('Shift+Digit2');
			await expect
				.poll(async () => (await profile.boundingBox())?.width ?? 0)
				.toBeGreaterThan(fitAllBox?.width ?? 0);
			await page.keyboard.press('ArrowRight');
			await expect.poll(async () => (await worldPosition(profile)).x).toBe(beforeNudge.x + 1);
		} finally {
			await resetBoard(request);
		}
	});

	test('moves and nudges an additive selection as one undoable group', async ({
		page,
		request
	}) => {
		await resetBoard(request);
		try {
			await openPortfolio(page);
			await expect(page.locator('[data-connection-state="open"]')).toBeVisible();

			const profile = page.locator(PROFILE_FRAME);
			const project = page.locator(PROJECT_FRAME);
			await page
				.getByRole('button', { name: 'Select National Medal of Honor Museum' })
				.click({ modifiers: ['Shift'] });
			await expect(page.getByText('2 frames selected', { exact: true })).toBeVisible();
			await expect(page.locator('.group-selection')).toBeVisible();

			const beforeProfile = await worldPosition(profile);
			const beforeProject = await worldPosition(project);
			const box = await profile.boundingBox();
			expect(box).not.toBeNull();
			if (!box) return;

			await page.mouse.move(box.x + 12, box.y + 12);
			await page.mouse.down();
			await page.mouse.move(box.x + 48, box.y + 31, { steps: 6 });
			await page.mouse.up();

			const movedProfile = await worldPosition(profile);
			const movedProject = await worldPosition(project);
			expect(movedProfile).not.toEqual(beforeProfile);
			expect(movedProject.x - beforeProject.x).toBeCloseTo(movedProfile.x - beforeProfile.x, 2);
			expect(movedProject.y - beforeProject.y).toBeCloseTo(movedProfile.y - beforeProfile.y, 2);
			await expect(page.getByRole('button', { name: 'Undo' })).toBeEnabled();

			await page.getByRole('button', { name: 'Undo' }).click();
			await expect.poll(async () => worldPosition(profile)).toEqual(beforeProfile);
			await expect.poll(async () => worldPosition(project)).toEqual(beforeProject);

			await page.getByRole('button', { name: 'Redo' }).click();
			await expect.poll(async () => worldPosition(profile)).toEqual(movedProfile);
			await expect.poll(async () => worldPosition(project)).toEqual(movedProject);

			const canvas = page.locator('[data-canvas-viewport]');
			await canvas.focus();
			await page.keyboard.press('Shift+ArrowDown');
			await expect.poll(async () => (await worldPosition(profile)).y).toBe(movedProfile.y + 10);
			await expect.poll(async () => (await worldPosition(project)).y).toBe(movedProject.y + 10);

			await page.keyboard.press('Control+z');
			await expect.poll(async () => worldPosition(profile)).toEqual(movedProfile);
			await expect.poll(async () => worldPosition(project)).toEqual(movedProject);
		} finally {
			await resetBoard(request);
		}
	});

	test('marquee-selects, highlights Layers on hover, and exposes metadata and tool shortcuts', async ({
		page,
		request
	}) => {
		await resetBoard(request);
		try {
			await openPortfolio(page);
			await expect(page.locator('[data-connection-state="open"]')).toBeVisible();
			await page.getByRole('button', { name: 'Fit all' }).click();

			const museum = page.locator(PROJECT_FRAME);
			const avenue = page.locator(AVENUE_FRAME);
			const museumBox = await museum.boundingBox();
			const avenueBox = await avenue.boundingBox();
			expect(museumBox).not.toBeNull();
			expect(avenueBox).not.toBeNull();
			if (!museumBox || !avenueBox) return;

			const start = {
				x: Math.min(museumBox.x, avenueBox.x) - 8,
				y: Math.min(museumBox.y, avenueBox.y) - 8
			};
			const end = {
				x: Math.max(museumBox.x + museumBox.width, avenueBox.x + avenueBox.width) + 8,
				y: Math.max(museumBox.y + museumBox.height, avenueBox.y + avenueBox.height) + 8
			};
			await page.mouse.move(start.x, start.y);
			await page.mouse.down();
			await page.mouse.move(end.x, end.y, { steps: 8 });
			await expect(page.locator('.selection-marquee')).toBeVisible();
			await page.mouse.up();
			await expect(page.locator('.selection-marquee')).toBeHidden();
			await expect(
				page.getByRole('button', { name: 'Select National Medal of Honor Museum' })
			).toHaveAttribute('aria-pressed', 'true');
			await expect(
				page.getByRole('button', { name: 'Select 1st Avenue Advisors' })
			).toHaveAttribute('aria-pressed', 'true');
			await expect(page.getByText('2 frames selected', { exact: true })).toBeVisible();

			const museumLayer = page.getByRole('group', {
				name: 'National Medal of Honor Museum layer',
				exact: true
			});
			await museumLayer.hover();
			await expect(museum).toHaveClass(/is-hovered/);
			await page.mouse.move(1_100, 80);
			await expect(museum).not.toHaveClass(/is-hovered/);

			await museumLayer
				.getByRole('button', { name: 'Hide National Medal of Honor Museum' })
				.click();
			await expect(museum).toBeHidden();
			await expect(
				museumLayer.getByRole('button', { name: 'Show National Medal of Honor Museum' })
			).toBeVisible();
			await museumLayer
				.getByRole('button', { name: 'Show National Medal of Honor Museum' })
				.click();
			await expect(museum).toBeVisible();

			await museumLayer
				.getByRole('button', { name: 'Select National Medal of Honor Museum' })
				.click();
			await museumLayer
				.getByRole('button', { name: 'Lock National Medal of Honor Museum' })
				.click();
			await expect(
				museumLayer.getByRole('button', { name: 'Unlock National Medal of Honor Museum' })
			).toBeVisible();
			await expect(museum).toHaveClass(/is-locked/);
			await expect(page.getByRole('spinbutton', { name: 'X' })).toBeDisabled();
			await museumLayer
				.getByRole('button', { name: 'Unlock National Medal of Honor Museum' })
				.click();

			await page.keyboard.press('h');
			await expect(page.getByRole('button', { name: 'Hand tool' })).toHaveAttribute(
				'aria-pressed',
				'true'
			);
			await page.keyboard.press('v');
			await expect(page.getByRole('button', { name: 'Select tool' })).toHaveAttribute(
				'aria-pressed',
				'true'
			);
			await page.keyboard.press('?');
			const shortcuts = page.getByRole('dialog', { name: 'Keyboard shortcuts' });
			await expect(shortcuts).toBeVisible();
			await expect(shortcuts.getByText('Hide or show selection')).toBeVisible();
			await page.keyboard.press('Escape');
			await expect(shortcuts).toBeHidden();
		} finally {
			await resetBoard(request);
		}
	});

	test('aligns and repositions a selection from the contextual inspector', async ({
		page,
		request
	}) => {
		await resetBoard(request);
		try {
			await openPortfolio(page);
			await expect(page.locator('[data-connection-state="open"]')).toBeVisible();
			const profile = page.locator(PROFILE_FRAME);
			const project = page.locator(PROJECT_FRAME);
			const initialProfile = await worldPosition(profile);
			const initialProject = await worldPosition(project);

			await page
				.getByRole('button', { name: 'Select National Medal of Honor Museum' })
				.click({ modifiers: ['Shift'] });
			await expect(page.getByRole('button', { name: 'Align left' })).toBeEnabled();
			await page.getByRole('button', { name: 'Align left' }).click();
			await expect.poll(async () => (await worldPosition(profile)).x).toBe(initialProfile.x);
			await expect.poll(async () => (await worldPosition(project)).x).toBe(initialProfile.x);

			await page.keyboard.press('Control+z');
			await expect.poll(async () => worldPosition(profile)).toEqual(initialProfile);
			await expect.poll(async () => worldPosition(project)).toEqual(initialProject);
			await page.keyboard.press('Control+Shift+z');
			await expect.poll(async () => (await worldPosition(project)).x).toBe(initialProfile.x);

			const xInput = page.getByRole('spinbutton', { name: 'X' });
			await xInput.fill('120');
			await xInput.press('Enter');
			await expect.poll(async () => (await worldPosition(profile)).x).toBe(120);
			await expect.poll(async () => (await worldPosition(project)).x).toBe(120);
		} finally {
			await resetBoard(request);
		}
	});
});
