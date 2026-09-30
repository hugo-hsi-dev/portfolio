import assert from 'node:assert/strict';
import test from 'node:test';
import { portfolioRequestRejection } from '../../src/middleware.ts';
const check = (path, method = 'POST', body) =>
	portfolioRequestRejection(
		new Request(`https://example.test${path}`, {
			method,
			...(body === undefined
				? {}
				: { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } })
		})
	);
const base = '/_emdash/api/content/portfolio_home/portfolio-v1%3Ahome';

test('block exact duplicate/permanent/create bypasses, including encoded collection names', async () => {
	assert.ok(await check(`${base}/duplicate`));
	assert.ok(await check(`${base}/permanent`, 'DELETE'));
	assert.ok(await check('/_emdash/api/content/portfolio_home'));
	assert.ok(await check('/_emdash/api/content/%70ortfolio_home/portfolio-v1%3Ahome/duplicate'));
	assert.equal(await check(`${base}/duplicate`, 'GET'), null);
	assert.equal(await check('/_emdash/api/content/posts/post/duplicate'), null);
	assert.equal(await check('/_emdash/api/setup'), null);
	assert.equal(await check('/_emdash/api/media/upload'), null);
});

test('published/scheduled/draft workflows and ordinary text edits stay available', async () => {
	for (const action of ['publish', 'unpublish', 'schedule', 'discard-draft', 'preview-url', 'lock'])
		assert.equal(await check(`${base}/${action}`), null);
	assert.equal(
		await check(base, 'PUT', {
			data: { headline: 'Edited' },
			_rev: 'revision',
			skipRevision: true,
			overrideLock: false,
			slug: '',
			status: 'draft'
		}),
		null
	);
	assert.equal(await check(`${base}?locale=en`, 'PUT', { data: {} }), null);
	assert.ok(await check(`${base}?locale=fr`, 'PUT', { data: {} }));
	assert.ok(await check(base, 'PUT', { slug: 'new-route' }));
	assert.ok(await check(base, 'PUT', { status: 'published' }));
	assert.ok(await check(base, 'PUT', { seo: { canonical: 'https://other.test' } }));
});

test('managed schema cannot be changed through collection/field endpoints', async () => {
	for (const path of [
		'portfolio_home',
		'portfolio_home/fields',
		'portfolio_home/fields/external_id'
	]) {
		for (const method of ['POST', 'PUT', 'DELETE'])
			assert.ok(await check(`/_emdash/api/schema/collections/${path}`, method));
		assert.equal(await check(`/_emdash/api/schema/collections/${path}`, 'GET'), null);
	}
	assert.ok(await check('/_emdash/api/schema/collections', 'POST', { slug: 'portfolio_home' }));
	assert.equal(await check('/_emdash/api/schema/collections/posts', 'PUT', {}), null);
});
