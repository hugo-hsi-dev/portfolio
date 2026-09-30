import assert from 'node:assert/strict';
import test from 'node:test';
import { access } from 'node:fs/promises';
import { withPortfolioD1Harness } from './d1-harness.mjs';
import { baseline, createDraftSeed } from './seed.mjs';

const png =
	'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6nV8AAAAASUVORK5CYII=';
const home = { collection: 'portfolio_home', id: 'portfolio-v1:home' };

test(
	'actual local D1/Worker draft import, publication, edits, media and failure boundaries',
	{ timeout: 180000 },
	async (t) => {
		let disposedRoot;
		await withPortfolioD1Harness(async ({ request, fetchMedia, root, logs }) => {
			disposedRoot = root;
			const ok = async (operation, payload = {}) => {
				const result = await request(operation, payload);
				assert.equal(result.status, 200, JSON.stringify(result) + logs().slice(-3000));
				assert.notEqual(result.body?.success, false, JSON.stringify(result.body));
				return result.body;
			};
			const unavailable = async () => {
				const result = await request('load');
				assert.equal(result.status, 503);
				assert.equal(result.body.error, 'uninitialized');
				assert.equal(result.body.message, 'Portfolio is temporarily unavailable.');
			};
			await t.test(
				'no administrator or published fallback is created by schema setup/import',
				async () => {
					await ok('migrate');
					await unavailable();
					const first = await ok('import');
					assert.equal(first.plan.creates, 17);
					const snapshot = await ok('snapshot');
					assert.equal(Object.values(snapshot).flat().length, 17);
					assert.ok(
						Object.values(snapshot)
							.flat()
							.every((row) => row.status === 'draft')
					);
					const again = await ok('import');
					assert.equal(again.applied, false);
					assert.equal(again.plan.noops, 17);
					assert.deepEqual(
						await ok('snapshot'),
						snapshot,
						'rerun must preserve rows, revisions and timestamps'
					);
					assert.equal((await ok('audit')).users, 0);
					await unavailable();
				}
			);
			await t.test('only deliberate publication exposes exact canonical content', async () => {
				for (const [collection, entries] of Object.entries(createDraftSeed().content))
					for (const entry of entries) await ok('publish', { collection, id: entry.id });
				assert.deepEqual(await ok('load'), baseline);
			});
			await t.test(
				'pending text edits stay private and guarded API writes are rejected',
				async () => {
					await ok('update', { ...home, data: { headline: 'Published only after approval' } });
					assert.equal((await ok('load')).hero.headline, baseline.hero.headline);
					for (const data of [
						{ position: 99 },
						{ external_id: 'other' },
						{ canonical: 'https://evil.example/' },
						{ headline: '{"json":true}' }
					]) {
						assert.equal((await request('update', { ...home, data })).body.success, false);
					}
					assert.equal(
						(
							await request('create', {
								collection: home.collection,
								body: { data: createDraftSeed().content.portfolio_home[0].data }
							})
						).body.success,
						false
					);
					assert.equal((await request('delete', home)).body.success, false);
					await ok('publish', home);
					assert.equal((await ok('load')).hero.headline, 'Published only after approval');
				}
			);
			await t.test(
				'import after publication/manual edits reports conflict without writes',
				async () => {
					const before = await ok('snapshot');
					const conflict = await request('import');
					assert.equal(conflict.status, 503);
					assert.match(conflict.body.message, /conflict/);
					assert.deepEqual(await ok('snapshot'), before);
				}
			);
			await t.test(
				'local R2 media keeps usage alt and appears only after publication',
				async () => {
					const body = {
						filename: 'portfolio-test.png',
						base64: png,
						contentType: 'image/png',
						alt: 'Library alt'
					};
					const upload = (await ok('media-upload', { body })).data.item;
					const duplicate = await ok('media-upload', { body });
					assert.equal(duplicate.data.deduplicated, true);
					assert.equal(duplicate.data.item.id, upload.id);
					const project = {
						collection: 'portfolio_projects',
						id: 'portfolio-v1:projects:medal-of-honor-museum'
					};
					await ok('update', {
						...project,
						data: { image: { provider: 'local', id: upload.id, alt: 'Published local pixel' } }
					});
					assert.deepEqual((await ok('load')).projects[2].image, baseline.projects[2].image);
					await ok('publish', project);
					assert.deepEqual((await ok('load')).projects[2].image, {
						src: upload.url,
						alt: 'Published local pixel'
					});
					const response = await fetchMedia(upload.url);
					assert.equal(response.status, 200);
					assert.match(response.headers.get('content-type'), /image\/png/);
					assert.deepEqual(Buffer.from(await response.arrayBuffer()), Buffer.from(png, 'base64'));
				}
			);
			await t.test('clearing optional editor values cannot break public rendering', async () => {
				const project = {
					collection: 'portfolio_projects',
					id: 'portfolio-v1:projects:medal-of-honor-museum'
				};
				const contact = { collection: 'portfolio_contacts', id: 'portfolio-v1:contacts:github' };
				await ok('update', { ...project, data: { url: null, image: null } });
				await ok('publish', project);
				await ok('update', { ...contact, data: { address: '' } });
				await ok('publish', contact);
				const result = await ok('load');
				assert.equal('url' in result.projects[2], false);
				assert.equal('image' in result.projects[2], false);
				assert.equal('address' in result.contacts[1], false);
			});
			await t.test(
				'unpublishing required content fails closed; deliberate republish recovers',
				async () => {
					await ok('unpublish', home);
					await unavailable();
					await ok('publish', home);
					assert.equal((await ok('load')).hero.headline, 'Published only after approval');
					assert.equal((await ok('audit')).users, 0);
				}
			);
		});
		await assert.rejects(access(disposedRoot), { code: 'ENOENT' });
	}
);
