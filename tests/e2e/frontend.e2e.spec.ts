import { test, expect } from '@playwright/test'

test.describe('Frontend', () => {
  test('can load the homepage', async ({ page }) => {
    await page.goto('http://localhost:3000')

    await expect(page).toHaveTitle(/Hugo Hsi/)

    const heroName = page.locator('#hero-eyebrow')
    await expect(heroName).toBeVisible()
  })
})
