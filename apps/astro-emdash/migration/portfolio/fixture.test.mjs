import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (name) => JSON.parse(readFileSync(new URL(name, import.meta.url), 'utf8'));
const fixture = read('fixture.json');
const manifest = read('manifest.json');
const resolve = (pointer) =>
	pointer
		.split('/')
		.slice(1)
		.reduce((value, key) => value[key], fixture);

test('ordered content has stable unique identities and the complete baseline inventory', () => {
	for (const [key, count] of Object.entries({
		projects: 5,
		experience: 3,
		education: 2,
		skillGroups: 3,
		contacts: 3
	})) {
		assert.equal(fixture[key].length, count, key);
		assert.equal(new Set(fixture[key].map((item) => item.id)).size, count, key);
	}
	assert.deepEqual(
		fixture.sections.map((section) => section.id),
		['top', 'projects', 'experience', 'education', 'tech', 'contact']
	);
	assert.equal(fixture.projects.filter((project) => project.image).length, 3);
	assert.equal(fixture.projects.filter((project) => project.url).length, 3);
	assert.equal(
		fixture.skillGroups.reduce((count, group) => count + group.items.length, 0),
		23
	);
});

test('source-to-target records cover every collection item once with title-independent identities', () => {
	assert.equal(new Set(manifest.records.map((record) => record.externalId)).size, 17);
	for (const key of ['projects', 'experience', 'education', 'skillGroups', 'contacts']) {
		fixture[key].forEach((item, position) => {
			const records = manifest.records.filter(
				(record) => record.fixturePointer === `/${key}/${position}`
			);
			assert.equal(records.length, 1);
			assert.equal(records[0].externalId, `portfolio-v1:${key}:${item.id}`);
			assert.equal(records[0].position, position);
			assert.equal(resolve(records[0].fixturePointer), item);
		});
	}
	const home = manifest.records.find((record) => record.externalId === 'portfolio-v1:home');
	assert.deepEqual(home.fixturePointers, ['/hero', '/footer', '/sections', '/seo']);
	for (const pointer of home.fixturePointers) assert.notEqual(resolve(pointer), undefined);
	for (const mapping of manifest.mappings) {
		assert.notEqual(resolve(mapping.target), undefined);
		for (const source of mapping.sources) {
			assert.ok(
				manifest.sources.some((entry) => entry.path === source.split('#')[0]),
				source
			);
		}
	}
});

test('asset references resolve without a build, CMS, or network and retain image semantics', () => {
	assert.equal(manifest.media.length, 11);
	assert.equal(new Set(manifest.media.map((asset) => asset.id)).size, 11);
	for (const asset of manifest.media) {
		assert.match(asset.sha256, /^[a-f0-9]{64}$/);
		assert.ok(asset.bytes > 0);
		if (asset.delivery === 'public') assert.ok(asset.publicUrl.startsWith('/'));
		if (asset.delivery === 'source-only') assert.equal(asset.publicUrl, null);
	}
	for (const project of fixture.projects.filter((item) => item.image)) {
		assert.ok(manifest.media.some((asset) => asset.publicUrl === project.image.src));
		assert.ok(project.image.alt.length > 0);
		assert.ok(project.image.fit === undefined || project.image.fit === 'logo');
	}
	assert.ok(manifest.media.some((asset) => asset.id === fixture.hero.resumeAction.mediaId));
	for (const path of fixture.ui.fontPreloads)
		assert.ok(manifest.media.some((asset) => asset.publicUrl === path));
	assert.equal(fixture.hero.resumeAction.download, 'Hugo-Hsi-Resume.pdf');
});

test('links, document semantics and unresolved migration decisions remain explicit', () => {
	const anchors = new Set([fixture.ui.main.id, ...fixture.sections.map((section) => section.id)]);
	for (const href of [
		fixture.ui.skipLink.href,
		fixture.ui.navigation.homeHref,
		fixture.hero.primaryAction.href
	]) {
		assert.ok(anchors.has(href.slice(1)));
	}
	assert.deepEqual(
		fixture.contacts.map((contact) => contact.id),
		['email', 'github', 'linkedin']
	);
	assert.equal(fixture.contacts[0].url, `mailto:${fixture.contacts[0].address}`);
	assert.equal(fixture.footer.heading, fixture.sections[5].title);
	assert.equal(fixture.hero.name, fixture.site.name);
	assert.equal(fixture.footer.copyright.year, 'runtime-current-year');
	assert.equal(fixture.site.language, 'en');
	assert.equal(fixture.ui.main.tabindex, -1);
	assert.equal(fixture.ui.decorations.ariaHidden, true);
	assert.equal(fixture.seo.canonical, fixture.seo.openGraph.url);
	assert.notEqual(new URL(fixture.seo.canonical).host, new URL(fixture.seo.sitemap.url).host);
	assert.match(fixture.footer.credit, /SvelteKit/);
	assert.deepEqual(
		manifest.decisions.map((decision) => decision.id),
		['canonical-host', 'framework-credit', 'resume-legacy-url']
	);
});
