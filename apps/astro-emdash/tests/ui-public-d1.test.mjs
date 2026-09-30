import assert from 'node:assert/strict';
import test from 'node:test';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { access, cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { withPortfolioD1Harness } from '../migration/portfolio/d1-harness.mjs';
import { baseline, createDraftSeed } from '../migration/portfolio/seed.mjs';

const testsRoot = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(testsRoot, '..');
const output = '/tmp/portfolio-ui-cms';
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');

/** Keep pnpm's real dependency paths and Astro's disposable root in one filesystem tree.
 * Astro 7 normalizes absolute stylesheet IDs under /tmp when the dependency is in
 * /workspace, which creates a broken virtual CSS request. State remains disposable;
 * this changes no application config, test routes, authentication or error checks.
 */
async function withUiD1Harness(callback) {
	const temporaryParent = resolve(appRoot, '.astro/ui-d1-temp');
	await mkdir(temporaryParent, { recursive: true });
	const previous = process.env.TMPDIR;
	process.env.TMPDIR = temporaryParent;
	try {
		return await withPortfolioD1Harness(callback);
	} finally {
		if (previous === undefined) delete process.env.TMPDIR;
		else process.env.TMPDIR = previous;
	}
}

function python(args, timeout = 90_000) {
	return new Promise((done, reject) => {
		const child = spawn('python', args, { stdio: ['ignore', 'pipe', 'pipe'] });
		let stdout = '';
		let stderr = '';
		const timer = setTimeout(() => {
			child.kill('SIGKILL');
			reject(new Error('Bounded browser verification timed out'));
		}, timeout);
		child.stdout.on('data', (data) => (stdout += data));
		child.stderr.on('data', (data) => (stderr += data));
		child.once('error', (error) => {
			clearTimeout(timer);
			reject(error);
		});
		child.once('exit', (code) => {
			clearTimeout(timer);
			if (code !== 0) reject(new Error(`Browser verification failed (${code}): ${stderr}`));
			else done(stdout);
		});
	});
}

async function browserParity(origin, phase) {
	const destination = resolve(output, phase);
	await python([resolve(testsRoot, 'ui-browser.py'), '--url', `${origin}/`, '--out', destination]);
	// Compare decoded pixels, not compressed PNG bytes. Requires Pillow already installed.
	const comparison = JSON.parse(
		await python([
			'-c',
			`import json,sys
from pathlib import Path
from PIL import Image,ImageChops
results={}
for name in ['astro-375.png','astro-768.png','astro-1440.png','astro-375-nojs.png']:
 a=Image.open(Path(sys.argv[1])/name).convert('RGB')
 b=Image.open(Path(sys.argv[2])/name).convert('RGB')
 assert a.size==b.size, name+' dimensions differ'
 difference=ImageChops.difference(a,b).getbbox()
 assert difference is None, name+' differs from committed source-parity baseline'
 results[name]={'size':list(a.size),'differing_pixels':0}
print(json.dumps(results))`,
			resolve(testsRoot, 'evidence'),
			destination
		])
	);
	await writeFile(
		resolve(destination, 'pixel-comparison.json'),
		JSON.stringify(comparison, null, 2)
	);
	return comparison;
}

test(
	'public route uses published local CMS content and fails closed',
	{ timeout: 300_000 },
	async () => {
		await mkdir(output, { recursive: true });
		let disposedRoot;
		const evidence = { publication: [], images: [], screenshots: {} };
		await withUiD1Harness(async ({ request, fetchMedia, root, logs }) => {
			disposedRoot = root;
			const probe = await fetchMedia('/_emdash/api/media/file/ui-public-origin-probe');
			const origin = new URL(probe.url).origin;
			assert.match(origin, /^http:\/\/127\.0\.0\.1:\d+$/, 'Harness must expose its local origin');
			// Copy only version-controlled UI assets; never environments, credentials or live data.
			await cp(resolve(appRoot, 'public'), resolve(root, 'public'), { recursive: true });
			const ok = async (operation, payload = {}) => {
				const response = await request(operation, payload);
				assert.equal(response.status, 200, `Local CMS ${operation} failed`);
				assert.notEqual(response.body?.success, false, `Local CMS ${operation} rejected`);
				return response.body;
			};
			const publicPage = () =>
				fetch(`${origin}/`, { redirect: 'error', signal: AbortSignal.timeout(20_000) });
			let unavailableBody;
			const unavailable = async (state) => {
				const response = await publicPage();
				assert.equal(response.status, 503);
				assert.equal(response.headers.get('cache-control'), 'private, no-store');
				assert.equal(response.headers.get('x-robots-tag'), 'noindex');
				assert.match(response.headers.get('content-type'), /text\/html/);
				const html = await response.text();
				assert.ok(html.includes('<h1>Portfolio is temporarily unavailable.</h1>'));
				assert.ok(html.includes('<meta name="robots" content="noindex">'));
				assert.ok(!html.includes(baseline.hero.headline));
				assert.ok(!html.includes('<article'));
				assert.doesNotMatch(html, /(?:D1|SQL|EmDash|stack|Error:|fixture|portfolio-v1)/);
				if (unavailableBody !== undefined) assert.equal(html, unavailableBody);
				unavailableBody = html;
				evidence.publication.push({ state, status: response.status });
			};
			const published = async (headline) => {
				const response = await publicPage();
				assert.equal(response.status, 200);
				assert.equal(response.headers.get('cache-control'), 'no-store');
				const html = await response.text();
				assert.ok(html.includes(headline));
				return html;
			};
			await ok('migrate');
			await unavailable('schema-only');
			const imported = await ok('import');
			assert.equal(imported.plan.creates, 17);
			await unavailable('17-drafts');
			const seed = createDraftSeed();
			let count = 0;
			for (const [collection, entries] of Object.entries(seed.content)) {
				for (const entry of entries) {
					await ok('publish', { collection, id: entry.id });
					count++;
				}
			}
			assert.equal(count, 17);
			await published(baseline.hero.headline);
			try {
				evidence.screenshots.published = await browserParity(origin, 'published');
			} catch (error) {
				await writeFile(resolve(output, 'runtime-failure.log'), logs());
				throw error;
			}
			const home = { collection: 'portfolio_home', id: seed.content.portfolio_home[0].id };
			const edited = 'A deliberately published local test headline.';
			await ok('update', { ...home, data: { headline: edited } });
			assert.ok(!(await published(baseline.hero.headline)).includes(edited));
			const preview = await fetch(`${origin}/?preview=1&status=draft`, {
				signal: AbortSignal.timeout(20_000)
			});
			assert.equal(preview.status, 200);
			const previewHtml = await preview.text();
			assert.ok(previewHtml.includes(baseline.hero.headline));
			assert.ok(!previewHtml.includes(edited));
			evidence.publication.push({ state: 'pending-edit-and-preview-query', visible: false });
			await ok('publish', home);
			const editedHtml = await published(edited);
			const h1 = editedHtml.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? '';
			assert.ok(h1.includes(edited));
			assert.ok(!h1.includes(baseline.hero.headline));
			evidence.publication.push({ state: 'published-edit', visible: true });
			await ok('update', { ...home, data: { headline: baseline.hero.headline } });
			await ok('publish', home);

			for (const project of baseline.projects.filter((entry) => entry.image)) {
				const bytes = await readFile(resolve(appRoot, 'public', project.image.src.slice(1)));
				const upload = (
					await ok('media-upload', {
						body: {
							filename: project.image.src.split('/').pop(),
							base64: bytes.toString('base64'),
							contentType: 'image/png',
							alt: project.image.alt
						}
					})
				).data.item;
				assert.match(upload.url, /^\/_emdash\/api\/media\/file\//);
				const entry = seed.content.portfolio_projects.find((item) =>
					item.id.endsWith(`:${project.id}`)
				);
				assert.ok(entry);
				const identity = { collection: 'portfolio_projects', id: entry.id };
				await ok('update', {
					...identity,
					data: { image: { provider: 'local', id: upload.id, alt: project.image.alt } }
				});
				assert.equal(
					(await ok('load')).projects.find((item) => item.id === project.id).image.src,
					project.image.src
				);
				await ok('publish', identity);
				assert.equal(
					(await ok('load')).projects.find((item) => item.id === project.id).image.src,
					upload.url
				);
				assert.ok((await published(baseline.hero.headline)).includes(upload.url));
				const media = await fetchMedia(upload.url);
				assert.equal(media.status, 200);
				assert.match(media.headers.get('content-type'), /image\/png/);
				assert.equal(hash(Buffer.from(await media.arrayBuffer())), hash(bytes));
				evidence.images.push({ project: project.id, url: upload.url, sha256: hash(bytes) });
			}
			evidence.screenshots.cmsMedia = await browserParity(origin, 'cms-media');
			await ok('unpublish', home);
			await unavailable('required-home-unpublished');
			await ok('publish', home);
			await published(baseline.hero.headline);
			assert.equal((await ok('audit')).users, 0);
		});
		await assert.rejects(access(disposedRoot), { code: 'ENOENT' });
		await writeFile(
			resolve(output, 'public-route-results.json'),
			JSON.stringify(evidence, null, 2)
		);
	}
);
