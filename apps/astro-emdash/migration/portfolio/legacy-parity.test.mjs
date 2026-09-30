import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import test from 'node:test';

const root = new URL('../../../../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const fixture = JSON.parse(readFileSync(new URL('fixture.json', import.meta.url), 'utf8'));
const manifest = JSON.parse(readFileSync(new URL('manifest.json', import.meta.url), 'utf8'));
const withoutIds = (items) =>
	items.map((item) => Object.fromEntries(Object.entries(item).filter(([key]) => key !== 'id')));
const normalize = (value) => value.replaceAll('&amp;', '&').replace(/\s+/g, ' ').trim();
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
async function loadSource(path) {
	// These are trusted, checked-in baseline modules. Remove only the SvelteKit asset resolver.
	const code = stripTypeScriptTypes(
		read(path).replace("import { asset } from '$app/paths';", 'const asset = (path) => path;')
	);
	return import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
}

test('every baseline source and media byte matches the recorded source manifest', () => {
	for (const source of manifest.sources)
		assert.equal(hash(readFileSync(new URL(source.path, root))), source.sha256, source.path);
	for (const asset of manifest.media) {
		const bytes = readFileSync(new URL(asset.source, root));
		assert.equal(bytes.length, asset.bytes, asset.source);
		assert.equal(hash(bytes), asset.sha256, asset.source);
	}
});

test('all data records preserve exact strings, order, optional fields and URLs', async () => {
	const original = await loadSource('src/lib/data/portfolio.ts');
	for (const key of ['projects', 'experience', 'education'])
		assert.deepEqual(withoutIds(fixture[key]), original[key]);
	assert.deepEqual(withoutIds(fixture.skillGroups), original.technologies);
	const contacts = await loadSource('src/lib/data/contact.ts');
	assert.deepEqual(withoutIds(fixture.contacts), contacts.contactLinks);
});

test('component-authored copy and metadata preserve rendered whitespace and punctuation', () => {
	const assertPresent = (path, values) => {
		const source = normalize(read(path));
		for (const value of values) assert.ok(source.includes(normalize(value)), `${path}: ${value}`);
	};
	assertPresent('src/lib/components/Hero.svelte', [
		fixture.hero.name,
		fixture.hero.headline,
		fixture.hero.description,
		fixture.hero.aside,
		fixture.hero.location,
		fixture.hero.primaryAction.label,
		fixture.hero.primaryAction.href,
		fixture.hero.resumeAction.label,
		fixture.hero.resumeAction.download,
		fixture.ui.decorations.quote
	]);
	assertPresent('src/lib/components/SiteFooter.svelte', [
		fixture.footer.heading,
		fixture.footer.description,
		fixture.footer.credit,
		fixture.footer.copyright.prefix,
		fixture.footer.copyright.suffix,
		'new Date().getFullYear()'
	]);
	assertPresent('src/lib/components/SiteNav.svelte', [
		fixture.site.name,
		fixture.ui.navigation.homeHref,
		fixture.ui.navigation.homeLabel,
		fixture.ui.navigation.socialLabel
	]);
	assertPresent('src/routes/+page.svelte', [
		fixture.seo.title,
		fixture.seo.description,
		fixture.seo.canonical,
		...Object.values(fixture.seo.openGraph),
		fixture.seo.themeColor,
		fixture.ui.skipLink.label,
		fixture.ui.skipLink.href,
		...fixture.ui.fontPreloads
	]);
	assertPresent('src/lib/components/ProjectsSection.svelte', [fixture.sections[1].title]);
	assertPresent('src/routes/+page.svelte', [fixture.sections[2].title, fixture.sections[3].title]);
	assertPresent('src/lib/components/SkillsSection.svelte', [fixture.sections[4].title]);
	assertPresent('src/lib/components/ProjectCard.svelte', [
		fixture.ui.projectLink.label,
		fixture.ui.projectLink.imageAriaLabel.replace('{title}', '${project.title}'),
		fixture.ui.projectLink.textAriaLabel.replace('{title}', '${project.title}')
	]);
	assertPresent('src/lib/components/TextLink.svelte', [fixture.ui.decorations.externalArrow]);
	assertPresent('static/sitemap.xml', Object.values(fixture.seo.sitemap));
	assertPresent('static/robots.txt', Object.values(fixture.seo.robots));
});
