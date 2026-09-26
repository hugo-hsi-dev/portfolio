import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createServer, type ViteDevServer } from 'vite';

let server: ViteDevServer;
before(async () => {
	server = await createServer({ server: { middlewareMode: true, hmr: false, watch: null } });
});
after(async () => {
	await server?.close();
});

/** Load a Svelte component through Vite and return its server-rendered body. */
async function renderModule(path: string) {
	const [{ default: component }, { render }] = await Promise.all([
		server.ssrLoadModule(path),
		server.ssrLoadModule('svelte/server')
	]);
	return render(component).body as string;
}

test('page renders complete accessible content without browser APIs or JavaScript', async () => {
	const html = await renderModule('/src/routes/+page.svelte');
	assert.equal((html.match(/<article\b/g) ?? []).length, 10);
	assert.equal((html.match(/<img\b/g) ?? []).length, 3);
	for (const id of [
		'hero-title',
		'projects-title',
		'experience-title',
		'education-title',
		'tech-title'
	]) {
		assert.ok(html.includes(`id="${id}"`), `${id} heading exists`);
		assert.ok(html.includes(`aria-labelledby="${id}"`), `${id} labels its section`);
	}
	const headline = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? '';
	assert.equal((headline.match(/Engineering products from design to database\./g) ?? []).length, 2);
	assert.ok(headline.includes('aria-hidden="true"'));
	assert.equal(
		(headline.match(/<span\b/g) ?? []).length,
		3,
		'headline retains text runs rather than character spans'
	);
	assert.ok(html.includes('download="Hugo-Hsi-Resume.pdf"'));
	assert.equal((html.match(/href="mailto:hugohsidev@gmail.com"/g) ?? []).length, 2);
	assert.equal((html.match(/href="https:\/\/github.com\/hugo-hsi-dev"/g) ?? []).length, 2);
	assert.equal((html.match(/href="https:\/\/www.linkedin.com\/in\/hugo-hsi"/g) ?? []).length, 2);
	assert.ok(!html.includes('href=""'));
});

test('shared links preserve native anchor attributes and isolate underline hover groups', async () => {
	const html = await renderModule('/tests/fixtures/Links.svelte');
	assert.match(html, /href="\/resume.pdf"/);
	assert.match(html, /download="resume.pdf"/);
	assert.match(html, /aria-label="Download fixture"/);
	assert.match(html, /target="_blank"/);
	assert.match(html, /rel="noreferrer"/);
	assert.match(html, /group\/link/);
	assert.match(html, /group-hover\/link:after:scale-x-100/);
	assert.match(html, /aria-hidden="true">↗/);
	assert.match(html, /data-magnetic-content/);
	assert.match(html, /class="fixture-magnetic fixture-active"/);
	assert.match(html, /aria-label="Magnetic fixture"/);
	assert.equal((html.match(/<a\b/g) ?? []).length, 3);
});
