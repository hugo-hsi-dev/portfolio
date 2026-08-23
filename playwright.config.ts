import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './tests',
	testMatch: '**/*.e2e.ts',
	fullyParallel: true,
	reporter: process.env.CI ? 'dot' : 'list',
	use: {
		baseURL: 'http://127.0.0.1:4173',
		screenshot: 'only-on-failure',
		trace: 'retain-on-failure'
	},
	projects: [
		{ name: 'desktop', use: { ...devices['Desktop Chrome'] } },
		{ name: 'mobile', use: { ...devices['iPhone 13'], browserName: 'chromium' } }
	],
	webServer: {
		command: 'pnpm build && pnpm preview',
		url: 'http://127.0.0.1:4173',
		reuseExistingServer: !process.env.CI,
		timeout: 180_000
	}
});
