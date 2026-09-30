import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { appRoot, validateLocalConfig, validateEnvFiles } from './validate.mjs';
import { readdirSync } from 'node:fs';

validateLocalConfig(JSON.parse(readFileSync(resolve(appRoot, 'wrangler.jsonc'), 'utf8')));
validateEnvFiles(readdirSync(appRoot).filter((name) => !name.endsWith('.example')));

const requireApp = createRequire(resolve(appRoot, 'package.json'));
const { getPlatformProxy } = await import(requireApp.resolve('wrangler'));
const proxy = await getPlatformProxy({
	configPath: resolve(appRoot, 'wrangler.jsonc'),
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
console.log('Ephemeral local D1, R2 and SESSION KV operations passed.');

const astroPackage = requireApp.resolve('astro/package.json');
const { bin } = JSON.parse(readFileSync(astroPackage, 'utf8'));
const cli = resolve(astroPackage, '..', bin.astro);
const child = spawn(process.execPath, [cli, 'preview', '--host', '127.0.0.1', '--port', '4387'], {
	cwd: appRoot,
	stdio: ['ignore', 'pipe', 'pipe']
});
let logs = '';
child.stdout.on('data', (chunk) => (logs += chunk));
child.stderr.on('data', (chunk) => (logs += chunk));
try {
	let response;
	for (let i = 0; i < 120; i++) {
		if (child.exitCode !== null) throw new Error(`Preview exited: ${logs}`);
		try {
			response = await fetch('http://127.0.0.1:4387/health.json', {
				signal: AbortSignal.timeout(3000)
			});
			if (response.ok) break;
		} catch {
			// Wait briefly for the local Worker to start.
		}
		await new Promise((done) => setTimeout(done, 250));
	}
	assert.equal(response?.status, 200, logs);
	assert.deepEqual(await response.json(), { status: 'ok' });
	const admin = await fetch('http://127.0.0.1:4387/_emdash/admin/setup', {
		redirect: 'follow',
		signal: AbortSignal.timeout(10000)
	});
	assert.equal(admin.status, 200, logs);
	assert.match(await admin.text(), /<html/);
	console.log('Built Worker health and EmDash setup routes passed; no administrator created.');
} finally {
	child.kill('SIGTERM');
	await new Promise((done) => {
		if (child.exitCode !== null) done();
		else child.once('exit', done);
	});
}
