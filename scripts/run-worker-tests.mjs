import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const wranglerDirectory = resolve('.wrangler');
const logsDirectory = resolve(wranglerDirectory, 'logs');
const registryDirectory = resolve(wranglerDirectory, 'registry');
await Promise.all([
	mkdir(logsDirectory, { recursive: true }),
	mkdir(registryDirectory, { recursive: true })
]);

const child = spawn(
	process.execPath,
	[
		resolve('node_modules/vitest/vitest.mjs'),
		'run',
		'--config',
		'vitest.worker.config.ts',
		'--maxWorkers=1',
		...process.argv.slice(2)
	],
	{
		stdio: 'inherit',
		env: {
			...process.env,
			MINIFLARE_REGISTRY_PATH: process.env.MINIFLARE_REGISTRY_PATH ?? registryDirectory,
			WRANGLER_LOG_PATH:
				process.env.WRANGLER_LOG_PATH ?? resolve(logsDirectory, 'vitest-worker.log'),
			WRANGLER_REGISTRY_PATH: process.env.WRANGLER_REGISTRY_PATH ?? registryDirectory
		}
	}
);

for (const signal of ['SIGINT', 'SIGTERM']) {
	process.once(signal, () => child.kill(signal));
}

child.once('error', (error) => {
	console.error(error);
	process.exit(1);
});

child.once('exit', (code, signal) => {
	if (signal) process.kill(process.pid, signal);
	process.exit(code ?? 1);
});
