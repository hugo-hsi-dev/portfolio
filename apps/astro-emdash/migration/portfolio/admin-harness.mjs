import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateLocalConfig } from '../../../../scripts/migration/validate.mjs';

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

/** Actual built Astro/Cloudflare Worker preview; all binding state lives in a disposable copy. */
export async function withPortfolioAdminHarness(callback) {
	const root = await mkdtemp(resolve(appRoot, '../../../portfolio-admin-test-'));
	const token = randomBytes(32).toString('hex');
	let child;
	let logs = '';
	try {
		for (const file of ['package.json', 'astro.config.mjs', 'wrangler.jsonc', 'tsconfig.json']) {
			await cp(resolve(appRoot, file), resolve(root, file));
		}
		for (const directory of ['src', 'migration']) {
			await cp(resolve(appRoot, directory), resolve(root, directory), { recursive: true });
		}
		await symlink(resolve(appRoot, 'node_modules'), resolve(root, 'node_modules'), 'dir');
		const astroConfig = await readFile(resolve(root, 'astro.config.mjs'), 'utf8');
		if (
			!astroConfig.includes('integrations: [') ||
			!astroConfig.includes('emdash({') ||
			astroConfig.includes('vite:')
		) {
			throw new Error('Harness config injection requires reviewed foundation config shape');
		}
		await writeFile(
			resolve(root, 'astro.config.mjs'),
			astroConfig
				.replace(
					'defineConfig({',
					`defineConfig({ vite: { cacheDir: ${JSON.stringify(resolve(root, '.vite-cache'))} },`
				)
				.replace(
					'integrations: [',
					`integrations: [{ name: 'disposable-portfolio-test', hooks: { 'astro:config:setup': ({ injectRoute }) => injectRoute({ pattern: '/_emdash/portfolio-d1-test', entrypoint: './src/pages/_emdash/portfolio-d1-test.ts' }) } },`
				)
		);
		const wrangler = JSON.parse(await readFile(resolve(root, 'wrangler.jsonc'), 'utf8'));
		validateLocalConfig(wrangler);
		// No environment files, credentials or app state are copied. Only fixed synthetic identities
		// are created by the temporary route for actual-session acceptance tests.
		const fixtureRoute = await readFile(
			resolve(appRoot, 'migration/portfolio/testing/admin-route.ts'),
			'utf8'
		);
		if (!fixtureRoute.includes('__TEST_TOKEN__'))
			throw new Error('Fixture token placeholder missing');
		await mkdir(resolve(root, 'src/pages/_emdash'), { recursive: true });
		await writeFile(
			resolve(root, 'src/pages/_emdash/portfolio-d1-test.ts'),
			fixtureRoute.replaceAll('__TEST_TOKEN__', token)
		);
		const port = await new Promise((done, reject) => {
			const server = createServer();
			server.on('error', reject);
			server.listen(0, '127.0.0.1', () => {
				const address = server.address();
				server.close(() => done(address.port));
			});
		});
		await mkdir(resolve(root, '.tmp'), { recursive: true });
		const env = Object.fromEntries(
			Object.entries(process.env).filter(([key]) => ['PATH', 'LANG', 'CI'].includes(key))
		);
		const childEnv = {
			...env,
			HOME: root,
			TMPDIR: resolve(root, '.tmp'),
			XDG_CONFIG_HOME: resolve(root, '.config'),
			WRANGLER_SEND_METRICS: 'false',
			CLOUDFLARE_CF_FETCH_ENABLED: 'false',
			ASTRO_TELEMETRY_DISABLED: '1'
		};
		const run = (args) => {
			const processChild = spawn(
				process.execPath,
				[resolve(root, 'node_modules/astro/bin/astro.mjs'), ...args],
				{
					cwd: root,
					env: childEnv,
					stdio: ['ignore', 'pipe', 'pipe']
				}
			);
			processChild.stdout.on('data', (chunk) => {
				logs += chunk;
			});
			processChild.stderr.on('data', (chunk) => {
				logs += chunk;
			});
			return processChild;
		};
		child = run(['build']);
		const buildCode = await new Promise((done, reject) => {
			child.once('error', reject);
			child.once('exit', done);
		});
		if (buildCode !== 0) throw new Error(`Disposable app build failed: ${logs.slice(-8000)}`);
		// Preview runs the actual built Worker against local emulated bindings.
		child = run(['preview', '--ignore-lock', '--host', '127.0.0.1', '--port', String(port)]);
		const request = async (operation, payload = {}) => {
			const response = await fetch(`http://127.0.0.1:${port}/_emdash/portfolio-d1-test`, {
				method: 'POST',
				headers: { 'content-type': 'application/json', 'x-test-token': token },
				body: JSON.stringify({ operation, ...payload }),
				signal: AbortSignal.timeout(120_000)
			});
			const body = await response.text();
			try {
				return {
					status: response.status,
					body: JSON.parse(body),
					cookies: response.headers.getSetCookie()
				};
			} catch {
				throw new Error(
					`Harness returned non-JSON (${response.status}): ${body.slice(0, 500)}\n${logs.slice(-8000)}`
				);
			}
		};
		let ready = false;
		for (let attempt = 0; attempt < 180; attempt++) {
			if (child.exitCode !== null) throw new Error(`Disposable Astro process exited: ${logs}`);
			try {
				const response = await fetch(`http://127.0.0.1:${port}/health.json`, {
					signal: AbortSignal.timeout(2000)
				});
				if (response.ok) {
					ready = true;
					break;
				}
			} catch {
				/* Starting the local built Worker preview. */
			}
			await new Promise((done) => setTimeout(done, 250));
		}
		if (!ready) throw new Error(`Disposable Astro process did not start: ${logs.slice(-12000)}`);
		const fetchMedia = async (path) => {
			if (
				!path.startsWith('/_emdash/api/media/file/') ||
				path.includes('..') ||
				path.includes('\\')
			) {
				throw new Error('Only a local EmDash media file path is allowed');
			}
			return fetch(`http://127.0.0.1:${port}${path}`, {
				redirect: 'error',
				signal: AbortSignal.timeout(10000)
			});
		};
		const fixture = (apiContext, operation, payload = {}) =>
			apiContext.post(`http://127.0.0.1:${port}/_emdash/portfolio-d1-test`, {
				headers: { 'x-test-token': token },
				data: { operation, ...payload }
			});
		return await callback({
			request,
			fixture,
			fetchMedia,
			root,
			origin: `http://127.0.0.1:${port}`,
			logs: () => logs
		});
	} finally {
		if (child && child.exitCode === null) {
			child.kill('SIGTERM');
			await new Promise((done) => {
				const timer = setTimeout(() => {
					child.kill('SIGKILL');
				}, 5000);
				child.once('exit', () => {
					clearTimeout(timer);
					done();
				});
			});
		}
		await rm(root, { recursive: true, force: true });
	}
}
