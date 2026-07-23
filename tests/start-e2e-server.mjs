import { spawn } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const runtimeDirectory = resolve('.wrangler/e2e');
const varsPath = resolve(runtimeDirectory, 'playwright.vars');

mkdirSync(runtimeDirectory, { recursive: true });
writeFileSync(
	varsPath,
	[
		'BOARD_RESET_TOKEN=playwright-owner-key-0123456789abcdef',
		'ALLOWED_ORIGINS=http://127.0.0.1:4173,http://localhost:4173',
		''
	].join('\n'),
	{ mode: 0o600 }
);

const child = spawn(
	resolve('node_modules/.bin/wrangler'),
	[
		'dev',
		'-c',
		'wrangler.jsonc',
		'-c',
		'workers/realtime/wrangler.jsonc',
		'--port',
		'4173',
		'--env-file',
		varsPath
	],
	{
		stdio: 'inherit',
		env: {
			...process.env,
			MINIFLARE_REGISTRY_PATH: resolve('.wrangler/registry'),
			WRANGLER_LOG_PATH: resolve('.wrangler/logs/playwright.log'),
			WRANGLER_REGISTRY_PATH: resolve('.wrangler/registry')
		}
	}
);

for (const signal of ['SIGINT', 'SIGTERM']) {
	process.once(signal, () => child.kill(signal));
}

child.once('error', (error) => {
	rmSync(varsPath, { force: true });
	throw error;
});

child.once('exit', (code) => {
	rmSync(varsPath, { force: true });
	process.exit(code ?? 1);
});
