import assert from 'node:assert/strict';
import test from 'node:test';
import {
	assemblePortfolio,
	PortfolioUnavailableError
} from '../../src/lib/server/portfolio-model.ts';
import { baseline, createDraftSeed } from './seed.mjs';

const published = () =>
	Object.fromEntries(
		Object.entries(createDraftSeed().content).map(([collection, entries]) => [
			collection,
			entries.map((entry) => ({
				...entry.data,
				id: entry.id,
				locale: entry.locale,
				status: 'published'
			}))
		])
	);
const fails = (input, code = 'invalid') =>
	assert.throws(
		() => assemblePortfolio(input),
		(error) =>
			error instanceof PortfolioUnavailableError &&
			error.code === code &&
			error.message === 'Portfolio is temporarily unavailable.'
	);

test('complete published CMS records reconstruct every baseline field exactly', () => {
	assert.deepEqual(assemblePortfolio(published()), baseline);
});
test('authored edits flow through all shared names without changing application-owned links', () => {
	const input = published();
	Object.assign(input.portfolio_home[0], {
		name: 'Edited Name',
		headline: 'Edited headline',
		footer_heading: 'Edited footer'
	});
	const result = assemblePortfolio(input);
	assert.equal(result.site.name, 'Edited Name');
	assert.equal(result.hero.name, 'Edited Name');
	assert.equal(result.ui.navigation.homeLabel, 'Edited Name, back to top');
	assert.equal(result.footer.copyright.suffix, ' Edited Name. All rights reserved.');
	assert.equal(result.hero.headline, 'Edited headline');
	assert.equal(result.sections.at(-1).title, 'Edited footer');
	assert.equal(result.hero.primaryAction.href, '#projects');
	assert.deepEqual(result.hero.resumeAction, baseline.hero.resumeAction);
});
test('empty, incomplete, duplicate, reordered identity and draft inputs never fall back', () => {
	fails({}, 'uninitialized');
	const missing = published();
	missing.portfolio_projects.pop();
	fails(missing, 'uninitialized');
	for (const change of [
		(input) => input.portfolio_home.push(input.portfolio_home[0]),
		(input) => (input.portfolio_projects[0].position = 1),
		(input) => (input.portfolio_home[0].external_id = 'other'),
		(input) => (input.portfolio_home[0].status = 'draft'),
		(input) => (input.portfolio_home[0].locale = 'fr'),
		(input) => (input.portfolio_home[0].headline = { decoded: 'JSON-looking text' })
	]) {
		const input = published();
		change(input);
		fails(input);
	}
});
test('optional project fields can be removed and actual resolved local images retain usage alt', () => {
	const input = published();
	delete input.portfolio_projects[2].url;
	delete input.portfolio_projects[2].image;
	input.portfolio_projects[3].image = {
		id: 'local-image',
		provider: 'local',
		src: '/_emdash/api/media/file/upload.png',
		alt: 'Updated alt'
	};
	const result = assemblePortfolio(input);
	assert.equal('image' in result.projects[2], false);
	assert.equal('url' in result.projects[2], false);
	assert.deepEqual(result.projects[3].image, {
		src: '/_emdash/api/media/file/upload.png',
		alt: 'Updated alt',
		fit: 'logo'
	});
});
test('unsafe links, unresolved media, absent alt, and inconsistent email fail closed', () => {
	for (const change of [
		(input) => (input.portfolio_projects[2].url = 'javascript:alert(1)'),
		(input) => (input.portfolio_projects[2].image.src = '//example.com/a.png'),
		(input) =>
			(input.portfolio_projects[2].image = { provider: 'local', id: 'missing', alt: 'No URL' }),
		(input) => (input.portfolio_projects[2].image.alt = ''),
		(input) => (input.portfolio_contacts[0].address = 'different@example.com')
	]) {
		const input = published();
		change(input);
		fails(input);
	}
});

test('cleared optional editor fields normalize to absent keys', () => {
	const input = published();
	input.portfolio_projects[2].url = '';
	input.portfolio_projects[2].image = '';
	input.portfolio_contacts[1].address = '';
	const result = assemblePortfolio(input);
	assert.equal('url' in result.projects[2], false);
	assert.equal('image' in result.projects[2], false);
	assert.equal('address' in result.contacts[1], false);
});
