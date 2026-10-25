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
	assert.match(html, /<main\b[^>]*id="main"[^>]*tabindex="-1"/);
	for (const title of ['National Medal of Honor Museum', '1st Avenue Advisors', 'MineCentral']) {
		assert.ok(html.includes(`aria-label="Visit site: ${title}"`));
	}
});

test('shared links preserve native anchor attributes and isolate underline hover groups', async () => {
	const html = await renderModule('/tests/fixtures/Links.svelte');
	assert.equal((html.match(/<a\b/g) ?? []).length, 3);
	const anchors = [...html.matchAll(/(<a\b[^>]*>)([\s\S]*?)<\/a>/g)];
	assert.equal(anchors.length, 3);
	// Links.svelte renders Button, TextLink, then MagneticLink.
	const [button, textLink, magneticLink] = anchors;

	assert.match(button[1], /\shref="\/resume\.pdf"/);
	assert.match(button[1], /\sdownload="resume\.pdf"/);
	assert.match(button[1], /\saria-label="Download fixture"/);
	assert.match(button[2], /Download/);

	assert.match(textLink[1], /\shref="https:\/\/example\.com"/);
	assert.match(textLink[1], /\starget="_blank"/);
	assert.match(textLink[1], /\srel="noreferrer"/);
	assert.match(textLink[1], /group\/link/);
	assert.match(textLink[2], /group-hover\/link:after:scale-x-100/);
	assert.match(textLink[2], /aria-hidden="true">↗/);
	assert.match(textLink[2], /Visit/);

	assert.match(magneticLink[1], /\shref="#top"/);
	assert.match(magneticLink[1], /\sclass="fixture-magnetic fixture-active"/);
	assert.match(magneticLink[1], /\saria-label="Magnetic fixture"/);
	// Remove comments first so neither their text nor backtracking can supply the label.
	const magneticContent = magneticLink[2].replace(/<!--[\s\S]*?-->/g, '');
	assert.match(
		magneticContent,
		/<span\b[^>]*\sdata-magnetic-content=""(?=\s|>)[^>]*>[^<]*Top[^<]*<\/span>/
	);
});
