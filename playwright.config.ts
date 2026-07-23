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
		command: 'pnpm build && node tests/start-e2e-server.mjs',
		url: 'http://127.0.0.1:4173',
		reuseExistingServer: false,
		timeout: 180_000
	}
});
