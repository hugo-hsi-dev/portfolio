import assert from 'node:assert/strict';
import test from 'node:test';
import { createDraftSeed } from './seed.mjs';
import {
	portfolioPolicy,
	validatePortfolioData,
	validatePortfolioSave
} from '../../src/lib/server/portfolio-policy.ts';

const seed = createDraftSeed();
const home = seed.content.portfolio_home[0];
const project = seed.content.portfolio_projects.find((entry) => entry.data.image);
const email = seed.content.portfolio_contacts.find((entry) => entry.id.endsWith(':email'));
const publish = (collection, item, ctx = {}) =>
	portfolioPolicy.hooks['content:beforePublish'].handler(
		{ collection, content: item, origin: { source: 'system' } },
		ctx
	);

test('all 17 canonical records satisfy publication validation', async () => {
	for (const [collection, records] of Object.entries(seed.content)) {
		for (const record of records) await publish(collection, record);
	}
});

test('API creates and changes to stable identities or application fields are blocked', () => {
	assert.throws(
		() => validatePortfolioSave({ collection: 'portfolio_home', isNew: true, content: home.data }),
		/reviewed import/
	);
	for (const content of [
		{ external_id: 'other' },
		{ position: 1 },
		{ canonical: 'https://example.com' }
	]) {
		assert.throws(() =>
			validatePortfolioSave({ collection: 'portfolio_home', isNew: false, id: home.id, content })
		);
	}
	assert.throws(
		() =>
			validatePortfolioSave({
				collection: 'portfolio_home',
				isNew: false,
				id: 'extra-home',
				content: {}
			}),
		/identity/
	);
	assert.doesNotThrow(() =>
		validatePortfolioSave({
			collection: 'portfolio_home',
			isNew: false,
			id: home.id,
			content: { headline: 'Edited headline' }
		})
	);
	assert.doesNotThrow(() =>
		validatePortfolioSave({ collection: 'other', isNew: true, content: {} })
	);
});

test('required fields, ordered repeater values and safe URLs are validated', async () => {
	await assert.rejects(
		publish('portfolio_home', { ...home, data: { ...home.data, headline: '' } }),
		/required/
	);
	await assert.rejects(publish('portfolio_home', { ...home, locale: 'fr' }), /locale/);
	await assert.rejects(publish('portfolio_home', { ...home, slug: 'home' }), /slug/);
	for (const url of [
		'javascript:alert(1)',
		'data:text/plain,hi',
		'//example.com',
		'https://user:pass@example.com',
		'https://example.com\\evil'
	]) {
		assert.throws(() => validatePortfolioData('portfolio_projects', project.id, { url }), /HTTPS/);
	}
	for (const technologies of [[], ['TypeScript'], [{ value: '' }]]) {
		assert.throws(
			() => validatePortfolioData('portfolio_projects', project.id, { technologies }),
			/ordered text/
		);
	}
});

test('JSON-shaped string fields are rejected without rejecting normal prose', () => {
	for (const headline of ['{"title":"test"}', '["test"]']) {
		assert.throws(
			() => validatePortfolioData('portfolio_home', home.id, { headline }),
			/decode it incorrectly/
		);
	}
	for (const headline of ['[A thought]', '{unfinished prose', 'Ordinary text']) {
		assert.doesNotThrow(() => validatePortfolioData('portfolio_home', home.id, { headline }));
	}
});

test('email address and URL must agree at publication', async () => {
	await assert.rejects(
		publish('portfolio_contacts', {
			...email,
			data: { ...email.data, address: 'other@example.com' }
		}),
		/must agree/
	);
	await assert.rejects(
		publish('portfolio_contacts', {
			...email,
			data: { ...email.data, url: `${email.data.url}?bcc=other@example.com` }
		}),
		/email URL/
	);
});

test('project media needs valid usage alt and ready local image record', async () => {
	const withImage = (image) => ({ ...project, data: { ...project.data, image } });
	await assert.rejects(
		publish('portfolio_projects', withImage({ ...project.data.image, alt: '' })),
		/alt text/
	);
	await assert.rejects(
		publish(
			'portfolio_projects',
			withImage({ ...project.data.image, src: 'https://unreviewed.example/image.png' })
		),
		/inventoried/
	);
	const local = withImage({ provider: 'local', id: 'local-image', alt: 'Updated project image' });
	await assert.rejects(publish('portfolio_projects', local), /ready CMS/);
	await assert.rejects(
		publish('portfolio_projects', local, { media: { get: async () => null } }),
		/ready CMS/
	);
	await assert.rejects(
		publish('portfolio_projects', local, {
			media: { get: async () => ({ mimeType: 'application/pdf' }) }
		}),
		/ready CMS/
	);
	await publish('portfolio_projects', local, {
		media: { get: async () => ({ mimeType: 'image/png' }) }
	});
});

test('delete guard and scheduling policy fail closed for managed collections', async () => {
	const hooks = portfolioPolicy.hooks;
	for (const collection of Object.keys(seed.content)) {
		assert.equal(
			await hooks['content:beforeDelete'].handler(
				{ collection, id: 'any-id', permanent: false },
				{}
			),
			false
		);
	}
	assert.equal(
		await hooks['content:beforeDelete'].handler(
			{ collection: 'other', id: 'any-id', permanent: false },
			{}
		),
		true
	);
	for (const hook of Object.values(hooks)) assert.equal(hook.errorPolicy, 'abort');
	await assert.rejects(
		hooks['content:beforeSchedule'].handler(
			{
				collection: 'portfolio_home',
				content: { ...home, data: {} },
				origin: { source: 'system' },
				scheduledAt: '2030-01-01'
			},
			{}
		),
		/immutable/
	);
});
