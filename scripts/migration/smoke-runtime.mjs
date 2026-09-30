import { cp, mkdir, readFile, symlink, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { validateLocalConfig } from './validate.mjs';

/** Copy only the built app and local config; never copy env files or CMS state. */
export async function prepareSmokeDirectory(source, scratch) {
	const sourceConfig = JSON.parse(await readFile(resolve(source, 'wrangler.jsonc'), 'utf8'));
	validateLocalConfig(sourceConfig);
	await mkdir(scratch, { recursive: true });
	await writeFile(resolve(scratch, 'wrangler.jsonc'), JSON.stringify(sourceConfig));
	await cp(resolve(source, 'dist'), resolve(scratch, 'dist'), { recursive: true });
	await symlink(resolve(source, 'node_modules'), resolve(scratch, 'node_modules'), 'dir');
	const builtPath = resolve(scratch, 'dist/server/wrangler.json');
	const builtConfig = JSON.parse(await readFile(builtPath, 'utf8'));
	validateLocalConfig(builtConfig);
	// The adapter embeds absolute source paths. Keep Wrangler's env discovery local.
	builtConfig.configPath = resolve(scratch, 'wrangler.jsonc');
	builtConfig.userConfigPath = resolve(scratch, 'wrangler.jsonc');
	await writeFile(builtPath, JSON.stringify(builtConfig));
	return builtPath;
}

export function smokeEnvironment(environment, scratch) {
	return {
		...Object.fromEntries(
			Object.entries(environment).filter(([key]) => ['PATH', 'TMPDIR', 'LANG', 'CI'].includes(key))
		),
		HOME: scratch,
		XDG_CONFIG_HOME: resolve(scratch, '.config'),
		WRANGLER_SEND_METRICS: 'false',
		CLOUDFLARE_CF_FETCH_ENABLED: 'false'
	};
}

/** Do not wait for a second exit event after an externally signaled child exited. */
export async function stopSmokeChild(child) {
	if (!child?.pid || child.exitCode !== null || child.signalCode !== null) return;
	await new Promise((done) => {
		const timer = setTimeout(() => child.kill('SIGKILL'), 5000);
		child.once('exit', () => {
			clearTimeout(timer);
			done();
		});
		child.kill('SIGTERM');
	});
}
