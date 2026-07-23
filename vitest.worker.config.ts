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
		include: ['workers/realtime/**/*.test.ts'],
		restoreMocks: true,
		coverage: {
			provider: 'istanbul',
			reportsDirectory: './coverage/worker',
			reporter: ['text', 'json-summary', 'html'],
			include: [
				'workers/realtime/index.ts',
				'workers/realtime/router.ts',
				'workers/realtime/room.ts',
				'workers/realtime/storage.ts',
				'workers/realtime/policy.ts',
				'workers/realtime/logger.ts',
				'workers/realtime/constants.ts'
			],
			exclude: ['**/*.test.ts', '**/*.d.ts', '**/test-helpers.ts'],
			thresholds: {
				lines: 80,
				statements: 80,
				functions: 80,
				branches: 75
			}
		}
	}
});
