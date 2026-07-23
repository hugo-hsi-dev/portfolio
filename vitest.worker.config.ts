import { cloudflareTest } from '@cloudflare/vitest-pool-workers';
import { defineConfig } from 'vitest/config';

process.env.BOARD_RESET_TOKEN ??= 'test-reset-token-at-least-32-characters';

export default defineConfig({
	plugins: [
		cloudflareTest({
			wrangler: { configPath: './workers/realtime/wrangler.jsonc' },
			miniflare: { bindings: { BOARD_RESET_TOKEN: 'test-reset-token-at-least-32-characters' } }
		})
	],
	test: {
		include: ['workers/realtime/**/*.test.ts']
	}
});
