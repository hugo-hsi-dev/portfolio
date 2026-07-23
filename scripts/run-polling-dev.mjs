import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const wranglerDirectory = resolve('.wrangler');
await Promise.all([
	mkdir(resolve(wranglerDirectory, 'logs'), { recursive: true }),
	mkdir(resolve(wranglerDirectory, 'registry'), { recursive: true }),
	mkdir(resolve(wranglerDirectory, 'cache'), { recursive: true }),
	mkdir(resolve(wranglerDirectory, 'state'), { recursive: true })
]);

const pnpmCli = process.env.npm_execpath;
if (!pnpmCli) {
	console.error('Run this fallback through `pnpm dev:polling`.');
	process.exit(1);
}

const child = spawn(process.execPath, [pnpmCli, 'dev'], {
	stdio: 'inherit',
	env: {
		...process.env,
		CHOKIDAR_USEPOLLING: 'true',
		MINIFLARE_REGISTRY_PATH: resolve(wranglerDirectory, 'registry'),
		WRANGLER_LOG_PATH: resolve(wranglerDirectory, 'logs', 'dev.log'),
		WRANGLER_REGISTRY_PATH: resolve(wranglerDirectory, 'registry'),
		XDG_CACHE_HOME: resolve(wranglerDirectory, 'cache')
	}
});

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
