import assert from 'node:assert/strict';
import test from 'node:test';
import { access } from 'node:fs/promises';
import { withPortfolioAdminHarness } from './admin-harness.mjs';
import { baseline } from './seed.mjs';
import { testPng, cookieHeader } from './admin-fixtures.mjs';

const home = '/_emdash/api/content/portfolio_home/portfolio-v1:home';

test(
	'actual HTTP authorization, editor session lifecycle and multipart media',
	{ timeout: 180000 },
	async (t) => {
		let disposed;
		await withPortfolioAdminHarness(async ({ request, origin, root }) => {
			disposed = root;
			assert.equal((await request('setup')).status, 200);
			const api = async (path, { method = 'GET', cookie, data, form, csrf = true } = {}) => {
				const response = await fetch(origin + path, {
					method,
					redirect: 'manual',
					signal: AbortSignal.timeout(10000),
					headers: {
						...(csrf ? { 'X-EmDash-Request': '1' } : {}),
						Origin: origin,
						...(cookie ? { Cookie: cookie } : {}),
						...(data ? { 'Content-Type': 'application/json' } : {})
					},
					body: form ?? (data ? JSON.stringify(data) : undefined)
				});
				return { status: response.status, body: await response.json() };
			};
			await t.test(
				'fixture refuses missing tokens, arbitrary identities and elevated roles',
				async () => {
					for (const token of [undefined, 'incorrect-token']) {
						const response = await fetch(origin + '/_emdash/portfolio-d1-test', {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
								...(token ? { 'x-test-token': token } : {})
							},
							body: JSON.stringify({ operation: 'identity', role: 'editor' }),
							signal: AbortSignal.timeout(10000)
						});
						assert.equal(response.status, 404);
					}
					for (const payload of [
						{ role: 'administrator' },
						{ role: 'editor', email: 'real@example.com' },
						{ role: 'editor', id: 'arbitrary' }
					]) {
						assert.equal((await request('identity', payload)).status, 400);
					}
				}
			);
			let editor;
			await t.test(
				'anonymous and insufficient-role writes are rejected by real middleware',
				async () => {
					assert.equal(
						(await api(home, { method: 'PUT', data: { data: { headline: 'Anonymous' } } })).status,
						401
					);
					const subscriber = await request('identity', { role: 'subscriber' });
					assert.equal(subscriber.status, 200);
					const cookie = cookieHeader(subscriber.cookies);
					assert.ok(cookie.startsWith('astro-session='));
					for (const [path, method, data] of [
						[home, 'PUT', { data: { headline: 'Forbidden' } }],
						[home + '/publish', 'POST', {}]
					]) {
						const denied = await api(path, { method, data, cookie });
						assert.equal(denied.status, 403);
						assert.equal(denied.body.error.code, 'FORBIDDEN');
					}
				}
			);
			await t.test(
				'real editor session authenticates and CSRF header remains required',
				async () => {
					const identity = await request('identity', { role: 'editor' });
					editor = cookieHeader(identity.cookies);
					assert.equal((await api('/_emdash/api/auth/me', { cookie: editor })).body.data.role, 40);
					const denied = await api(home, {
						method: 'PUT',
						data: { data: { headline: 'No header' } },
						cookie: editor,
						csrf: false
					});
					assert.equal(denied.status, 403);
					assert.equal(denied.body.error.code, 'CSRF_REJECTED');
				}
			);
			await t.test(
				'HTTP Save stages content and publish/unpublish controls public reads',
				async () => {
					assert.equal((await request('load')).status, 503);
					assert.equal((await request('publish-baseline')).body.published, 17);
					assert.deepEqual((await request('load')).body, baseline);
					const saved = await api(home, {
						method: 'PUT',
						cookie: editor,
						data: { data: { headline: 'HTTP editor draft' } }
					});
					assert.equal(saved.status, 200, JSON.stringify(saved.body));
					assert.equal((await request('load')).body.hero.headline, baseline.hero.headline);
					assert.equal(
						(await api(home + '/publish', { method: 'POST', cookie: editor, data: {} })).status,
						200
					);
					assert.equal((await request('load')).body.hero.headline, 'HTTP editor draft');
					assert.equal(
						(await api(home + '/unpublish', { method: 'POST', cookie: editor, data: {} })).status,
						200
					);
					assert.equal((await request('load')).status, 503);
					assert.equal(
						(await api(home + '/publish', { method: 'POST', cookie: editor, data: {} })).status,
						200
					);
				}
			);
			await t.test('policy denial leaves the public value unchanged', async () => {
				const before = (await api(home, { cookie: editor })).body.data.item.data;
				const denied = await api(home, {
					method: 'PUT',
					cookie: editor,
					data: { data: { position: 99 } }
				});
				assert.equal(denied.status, 500);
				assert.equal(denied.body.error.code, 'CONTENT_HOOK_ERROR');
				assert.deepEqual((await api(home, { cookie: editor })).body.data.item.data, before);
				assert.equal((await request('load')).body.hero.headline, 'HTTP editor draft');
			});
			await t.test(
				'multipart upload and replacement traverse authenticated media endpoints',
				async () => {
					const png = testPng(255, 0, 0);
					const replacement = testPng(0, 255, 0);
					const form = new FormData();
					form.set('file', new Blob([png], { type: 'image/png' }), 'http-pixel.png');
					const uploaded = await api('/_emdash/api/media', {
						method: 'POST',
						cookie: editor,
						form
					});
					assert.equal(uploaded.status, 201, JSON.stringify(uploaded.body));
					const item = uploaded.body.data.item;
					assert.ok(item.id && item.storageKey);
					const initial = await fetch(origin + `/_emdash/api/media/file/${item.storageKey}`, {
						signal: AbortSignal.timeout(10000)
					});
					assert.deepEqual(Buffer.from(await initial.arrayBuffer()), png);
					const replace = new FormData();
					replace.set('file', new Blob([replacement], { type: 'image/png' }), 'replacement.png');
					replace.set('width', '1');
					replace.set('height', '1');
					const changed = await api(`/_emdash/api/media/${item.id}/replace`, {
						method: 'PUT',
						cookie: editor,
						form: replace
					});
					assert.equal(changed.status, 200, JSON.stringify(changed.body));
					const response = await fetch(origin + `/_emdash/api/media/file/${item.storageKey}`, {
						signal: AbortSignal.timeout(10000)
					});
					assert.equal(response.status, 200);
					assert.deepEqual(Buffer.from(await response.arrayBuffer()), replacement);
				}
			);
			await t.test(
				'logout invalidates the genuine session and no passkeys were enrolled',
				async () => {
					assert.equal(
						(await api('/_emdash/api/auth/logout', { method: 'POST', cookie: editor, data: {} }))
							.status,
						200
					);
					assert.equal((await api('/_emdash/api/auth/me', { cookie: editor })).status, 401);
					assert.deepEqual((await request('audit')).body, { users: 2, passkeys: 0 });
				}
			);
		});
		await assert.rejects(access(disposed), { code: 'ENOENT' });
	}
);
