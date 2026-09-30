import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

/** Actual Astro/Cloudflare Vite runtime; all binding state lives in a disposable copy. */
export async function withPortfolioD1Harness(callback) {
	const root = await mkdtemp(resolve(tmpdir(), 'portfolio-d1-'));
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
		if (
			wrangler.workers_dev !== false ||
			wrangler.preview_urls !== false ||
			[
				...(wrangler.d1_databases ?? []),
				...(wrangler.r2_buckets ?? []),
				...(wrangler.kv_namespaces ?? [])
			].some((binding) => binding.remote !== false)
		)
			throw new Error('D1 harness requires explicitly local-only bindings');
		// No environment files, credentials, app state, public data or admin users are copied.
		const fixtureRoute = await readFile(
			resolve(appRoot, 'migration/portfolio/testing/d1-route.ts'),
			'utf8'
		);
		await mkdir(resolve(root, 'src/pages/_emdash'), { recursive: true });
		await writeFile(
			resolve(root, 'src/pages/_emdash/portfolio-d1-test.ts'),
			fixtureRoute.replace('__TEST_TOKEN__', token)
		);
		const port = await new Promise((done, reject) => {
			const server = createServer();
			server.on('error', reject);
			server.listen(0, '127.0.0.1', () => {
				const address = server.address();
				server.close(() => done(address.port));
			});
		});
		const env = Object.fromEntries(
			Object.entries(process.env).filter(([key]) => ['PATH', 'TMPDIR', 'LANG', 'CI'].includes(key))
		);
		child = spawn(
			process.execPath,
			[
				resolve(root, 'node_modules/astro/bin/astro.mjs'),
				'dev',
				'--host',
				'127.0.0.1',
				'--port',
				String(port)
			],
			{
				cwd: root,
				env: {
					...env,
					HOME: root,
					XDG_CONFIG_HOME: resolve(root, '.config'),
					WRANGLER_SEND_METRICS: 'false',
					CLOUDFLARE_CF_FETCH_ENABLED: 'false',
					ASTRO_TELEMETRY_DISABLED: '1'
				},
				stdio: ['ignore', 'pipe', 'pipe']
			}
		);
		child.stdout.on('data', (chunk) => {
			logs += chunk;
		});
		child.stderr.on('data', (chunk) => {
			logs += chunk;
		});
		const request = async (operation, payload = {}) => {
			const response = await fetch(`http://127.0.0.1:${port}/_emdash/portfolio-d1-test`, {
				method: 'POST',
				headers: { 'content-type': 'application/json', 'x-test-token': token },
				body: JSON.stringify({ operation, ...payload }),
				signal: AbortSignal.timeout(120_000)
			});
			const body = await response.text();
			try {
				return { status: response.status, body: JSON.parse(body) };
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
				/* Starting the local Vite/workerd processes. */
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
		return await callback({ request, fetchMedia, root, logs: () => logs });
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
