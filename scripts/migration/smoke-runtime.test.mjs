import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { prepareSmokeDirectory, smokeEnvironment, stopSmokeChild } from './smoke-runtime.mjs';
import { appRoot } from './validate.mjs';

async function fixture(callback) {
	const root = await mkdtemp(resolve(tmpdir(), 'portfolio-smoke-contract-'));
	try {
		const source = resolve(root, 'source');
		const scratch = resolve(root, 'scratch');
		await mkdir(resolve(source, 'dist/server'), { recursive: true });
		await mkdir(resolve(source, 'node_modules'));
		const config = JSON.parse(await readFile(resolve(appRoot, 'wrangler.jsonc'), 'utf8'));
		await writeFile(resolve(source, 'wrangler.jsonc'), JSON.stringify(config));
		await writeFile(
			resolve(source, 'dist/server/wrangler.json'),
			JSON.stringify({
				...config,
				worker_loaders: [],
				configPath: '/original/wrangler.jsonc',
				userConfigPath: '/original/wrangler.jsonc'
			})
		);
		await callback({ source, scratch, config });
	} finally {
		await rm(root, { recursive: true, force: true });
	}
}

test('smoke copies built inputs without local env files/state and rebases config discovery', async () => {
	await fixture(async ({ source, scratch }) => {
		for (const name of ['.env', '.dev.vars', 'emdash-env.d.ts'])
			await writeFile(resolve(source, name), 'excluded');
		await mkdir(resolve(source, '.wrangler/state'), { recursive: true });
		await writeFile(resolve(source, '.wrangler/state/sentinel'), 'preserve');
		const built = await prepareSmokeDirectory(source, scratch);
		assert.deepEqual((await readdir(scratch)).sort(), ['dist', 'node_modules', 'wrangler.jsonc']);
		const config = JSON.parse(await readFile(built, 'utf8'));
		assert.equal(config.configPath, resolve(scratch, 'wrangler.jsonc'));
		assert.equal(config.userConfigPath, config.configPath);
		assert.equal(await readFile(resolve(source, '.wrangler/state/sentinel'), 'utf8'), 'preserve');
	});
});

test('smoke rejects a remote resource in generated Worker configuration', async () => {
	await fixture(async ({ source, scratch, config }) => {
		config.d1_databases[0].remote = true;
		await writeFile(resolve(source, 'dist/server/wrangler.json'), JSON.stringify(config));
		await assert.rejects(prepareSmokeDirectory(source, scratch), /local emulation/);
	});
});

test('smoke child excludes credentials and uses isolated config home', () => {
	const env = smokeEnvironment(
		{
			PATH: '/bin',
			CI: 'true',
			CLOUDFLARE_API_TOKEN: 'excluded',
			EMDASH_SITE_URL: 'excluded',
			CLOUDFLARE_ENV: 'production',
			HOME: '/original'
		},
		'/scratch'
	);
	assert.equal(env.PATH, '/bin');
	assert.equal(env.HOME, '/scratch');
	assert.equal(env.XDG_CONFIG_HOME, '/scratch/.config');
	assert.equal(env.CLOUDFLARE_API_TOKEN, undefined);
	assert.equal(env.EMDASH_SITE_URL, undefined);
	assert.equal(env.CLOUDFLARE_ENV, undefined);
});

test(
	'smoke cleanup completes when its child already exited by signal',
	{ timeout: 1000 },
	async () => {
		const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)']);
		try {
			const exited = once(child, 'exit');
			child.kill('SIGTERM');
			await exited;
			assert.equal(child.exitCode, null);
			assert.equal(child.signalCode, 'SIGTERM');
			await stopSmokeChild(child);
		} finally {
			child.kill('SIGKILL');
		}
	}
);
