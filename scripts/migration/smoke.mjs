import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { createServer } from 'node:net';
import { spawn } from 'node:child_process';
import { appRoot, validateEnvFiles } from './validate.mjs';
import { prepareSmokeDirectory, smokeEnvironment, stopSmokeChild } from './smoke-runtime.mjs';

validateEnvFiles((await readdir(appRoot)).filter((name) => !name.endsWith('.example')));
const scratch = await mkdtemp(resolve(tmpdir(), 'portfolio-smoke-'));
let child;
let logs = '';
const interruption = new AbortController();
const signalHandlers = ['SIGINT', 'SIGTERM'].map((signal) => {
	const handler = () => {
		interruption.abort(new Error(`Smoke interrupted by ${signal}`));
		child?.kill('SIGTERM');
	};
	// Keep the listener until finally: signal-exit must see our cleanup handler.
	process.on(signal, handler);
	return [signal, handler];
});
try {
	const builtConfig = await prepareSmokeDirectory(appRoot, scratch);
	interruption.signal.throwIfAborted();
	const requireApp = createRequire(resolve(appRoot, 'package.json'));
	const { getPlatformProxy } = await import(requireApp.resolve('wrangler'));
	const proxy = await getPlatformProxy({
		configPath: resolve(scratch, 'wrangler.jsonc'),
		envFiles: [],
		remoteBindings: false,
		persist: false
	});
	try {
		assert.equal((await proxy.env.DB.prepare('SELECT 1 AS ready').first()).ready, 1);
		await proxy.env.MEDIA.put('foundation-smoke', 'local media');
		assert.equal(await (await proxy.env.MEDIA.get('foundation-smoke')).text(), 'local media');
		await proxy.env.SESSION.put('foundation-smoke', 'local session');
		assert.equal(await proxy.env.SESSION.get('foundation-smoke'), 'local session');
	} finally {
		await proxy.dispose();
	}
	interruption.signal.throwIfAborted();
	console.log('Ephemeral local D1, R2 and SESSION KV operations passed.');
	const port = await new Promise((done, reject) => {
		const server = createServer();
		server.on('error', reject);
		server.listen(0, '127.0.0.1', () => {
			const { port } = server.address();
			server.close(() => done(port));
		});
	});
	// Run the copied built Worker directly: no Astro backgrounding or source state.
	const wranglerPackage = requireApp.resolve('wrangler/package.json');
	const { bin } = JSON.parse(await readFile(wranglerPackage, 'utf8'));
	const cli = resolve(wranglerPackage, '..', bin.wrangler);
	child = spawn(
		process.execPath,
		[
			cli,
			'dev',
			'--config',
			builtConfig,
			'--local',
			'--ip',
			'127.0.0.1',
			'--port',
			String(port),
			'--persist-to',
			resolve(scratch, 'state')
		],
		{ cwd: scratch, env: smokeEnvironment(process.env, scratch), stdio: ['ignore', 'pipe', 'pipe'] }
	);
	child.stdout.on('data', (chunk) => (logs += chunk));
	child.stderr.on('data', (chunk) => (logs += chunk));
	let spawnError;
	child.on('error', (error) => (spawnError = error));
	const origin = `http://127.0.0.1:${port}`;
	let response;
	for (let i = 0; i < 120; i++) {
		interruption.signal.throwIfAborted();
		if (spawnError) throw spawnError;
		if (child.exitCode !== null || child.signalCode !== null)
			throw new Error(`Worker exited: ${logs}`);
		try {
			response = await fetch(`${origin}/health.json`, {
				signal: AbortSignal.any([interruption.signal, AbortSignal.timeout(3000)])
			});
			if (response.ok) break;
		} catch {
			// Wait briefly for the disposable local Worker to start.
		}
		await new Promise((done) => setTimeout(done, 250));
	}
	assert.equal(response?.status, 200, logs);
	assert.deepEqual(await response.json(), { status: 'ok' });
	const admin = await fetch(`${origin}/_emdash/admin/setup`, {
		redirect: 'error',
		signal: AbortSignal.any([interruption.signal, AbortSignal.timeout(10000)])
	});
	assert.equal(admin.status, 200, logs);
	assert.match(await admin.text(), /<html/);
	console.log(
		'Disposable built Worker health and EmDash setup routes passed; no administrator created.'
	);
} finally {
	await stopSmokeChild(child);
	await rm(scratch, { recursive: true, force: true });
	for (const [signal, handler] of signalHandlers) process.removeListener(signal, handler);
}
