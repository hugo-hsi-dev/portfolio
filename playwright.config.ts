import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: './tests',
	testMatch: '**/*.e2e.ts',
	fullyParallel: false,
	workers: 1,
	use: {
		baseURL: 'http://127.0.0.1:4173',
		trace: 'retain-on-failure'
	},
	webServer: {
		command:
			'pnpm build && pnpm exec wrangler dev -c wrangler.jsonc -c workers/realtime/wrangler.jsonc --port 4173',
		url: 'http://127.0.0.1:4173',
		env: {
			BOARD_RESET_TOKEN: 'playwright-owner-key',
			CHOKIDAR_USEPOLLING: 'true',
			CLOUDFLARE_INCLUDE_PROCESS_ENV: 'true',
			MINIFLARE_REGISTRY_PATH: '.wrangler/registry',
			WRANGLER_LOG_PATH: '.wrangler/logs/playwright.log',
			WRANGLER_REGISTRY_PATH: '.wrangler/registry'
		},
		reuseExistingServer: !process.env.CI,
		timeout: 180_000
	}
});
