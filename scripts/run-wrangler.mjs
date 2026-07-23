import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const wranglerDirectory = resolve('.wrangler');
const localPaths = {
	logs: resolve(wranglerDirectory, 'logs'),
	registry: resolve(wranglerDirectory, 'registry'),
	cache: resolve(wranglerDirectory, 'cache'),
	state: resolve(wranglerDirectory, 'state')
};

await Promise.all(
	Object.values(localPaths).map((directory) => mkdir(directory, { recursive: true }))
);

const child = spawn(
	process.execPath,
	[resolve('node_modules/wrangler/bin/wrangler.js'), ...process.argv.slice(2)],
	{
		stdio: 'inherit',
		env: {
			...process.env,
			MINIFLARE_REGISTRY_PATH: process.env.MINIFLARE_REGISTRY_PATH ?? localPaths.registry,
			WRANGLER_LOG_PATH: process.env.WRANGLER_LOG_PATH ?? resolve(localPaths.logs, 'wrangler.log'),
			WRANGLER_REGISTRY_PATH: process.env.WRANGLER_REGISTRY_PATH ?? localPaths.registry,
			XDG_CACHE_HOME: process.env.XDG_CACHE_HOME ?? localPaths.cache
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
