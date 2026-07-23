import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const wranglerDirectory = resolve('.wrangler');
const logsDirectory = resolve(wranglerDirectory, 'logs');
const registryDirectory = resolve(wranglerDirectory, 'registry');
const cacheDirectory = resolve(wranglerDirectory, 'cache');
await Promise.all([
	mkdir(logsDirectory, { recursive: true }),
	mkdir(registryDirectory, { recursive: true }),
	mkdir(cacheDirectory, { recursive: true })
]);

const isBuild = process.argv[2] === 'build';
const child = spawn(
	process.execPath,
	[resolve('node_modules/vite/bin/vite.js'), ...process.argv.slice(2)],
	{
		stdio: 'inherit',
		env: {
			...process.env,
			...(isBuild ? { CHOKIDAR_USEPOLLING: 'true' } : {}),
			MINIFLARE_REGISTRY_PATH: process.env.MINIFLARE_REGISTRY_PATH ?? registryDirectory,
			WRANGLER_LOG_PATH: process.env.WRANGLER_LOG_PATH ?? resolve(logsDirectory, 'vite.log'),
			WRANGLER_REGISTRY_PATH: process.env.WRANGLER_REGISTRY_PATH ?? registryDirectory,
			XDG_CACHE_HOME: process.env.XDG_CACHE_HOME ?? cacheDirectory
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
