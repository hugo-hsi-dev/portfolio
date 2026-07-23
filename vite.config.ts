import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import adapter from '@sveltejs/adapter-cloudflare';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	resolve: process.env.VITEST ? { conditions: ['browser'] } : undefined,
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter()
		})
	],
	test: {
		expect: { requireAssertions: true },
		environment: 'node',
		include: [
			'src/**/*.{test,spec}.{js,ts}',
			'packages/realtime-contract/src/**/*.{test,spec}.{js,ts}'
		],
		setupFiles: ['./src/test/setup.ts'],
		restoreMocks: true,
		coverage: {
			provider: 'v8',
			reportsDirectory: './coverage/app',
			reporter: ['text', 'json-summary', 'html'],
			include: [
				'src/lib/features/portfolio-content/**/*.ts',
				'src/lib/features/portfolio-board/**/*.ts',
				'src/lib/server/board-reset.ts',
				'src/lib/server/board-websocket.ts',
				'src/lib/server/observability.ts',
				'src/lib/server/request-policy.ts',
				'packages/realtime-contract/src/**/*.ts'
			],
			exclude: ['**/*.test.ts', '**/*.spec.ts', '**/*.d.ts'],
			thresholds: {
				lines: 80,
				statements: 80,
				functions: 80,
				branches: 75
			}
		}
	}
});
