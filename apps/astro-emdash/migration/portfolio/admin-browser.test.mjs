import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { withPortfolioAdminHarness } from './admin-harness.mjs';
import { testPng } from './admin-fixtures.mjs';
import { baseline } from './seed.mjs';

const packageRoot = process.env.PORTFOLIO_BROWSER_PACKAGE_ROOT;
const executablePath = process.env.PORTFOLIO_CHROMIUM_EXECUTABLE;
const skip =
	!packageRoot && !executablePath
		? 'Set PORTFOLIO_BROWSER_PACKAGE_ROOT and PORTFOLIO_CHROMIUM_EXECUTABLE to require local browser acceptance.'
		: false;

test(
	'authenticated Chromium editor, publication and media picker acceptance',
	{ skip, timeout: 240000 },
	async (t) => {
		assert.ok(
			packageRoot && executablePath,
			'Both browser package root and Chromium executable are required when browser acceptance is requested.'
		);
		const require = createRequire(resolve(packageRoot, 'package.json'));
		const { chromium } = require('playwright-core');
		const browser = await chromium.launch({
			executablePath,
			headless: true,
			args: ['--no-sandbox']
		});
		try {
			await withPortfolioAdminHarness(async ({ request, fixture, origin, logs }) => {
				assert.equal((await request('setup')).status, 200);
				assert.equal((await request('publish-baseline')).status, 200);
				const context = await browser.newContext();
				try {
					await context.route('**/*', (route) =>
						new URL(route.request().url()).origin === origin ? route.continue() : route.abort()
					);
					const identity = await fixture(context.request, 'identity', { role: 'editor' });
					assert.equal(identity.status(), 200);
					const page = await context.newPage();
					page.setDefaultTimeout(15000);
					const errors = [];
					page.on('pageerror', (error) => errors.push(error.message));
					await page.goto(origin + '/_emdash/admin/content/portfolio_home/portfolio-v1:home');
					try {
						await page.getByLabel('Headline', { exact: true }).waitFor();
					} catch (error) {
						throw new Error(
							`${error.message}\n${(await page.locator('body').innerText()).slice(0, 2500)}\n${errors.join('\n')}\n${logs().slice(-4000)}`,
							{ cause: error }
						);
					}
					await page.getByRole('button', { name: 'Get Started', exact: true }).click();
					// Chromium permits Secure cookies on loopback HTTP; Playwright's API client
					// does not. Replay only the cookie actually issued by Astro, without changing
					// its value/flags or installing a substitute authentication mechanism.
					const sessionHeaders = async () => ({
						Cookie: (await context.cookies())
							.map(({ name, value }) => `${name}=${value}`)
							.join('; ')
					});
					const contentResponse = (method, suffix = '') =>
						page.waitForResponse(
							(response) =>
								response.request().method() === method &&
								new URL(response.url()).pathname.endsWith('portfolio-v1:home' + suffix)
						);
					const publish = async (label) => {
						await page.getByRole('button', { name: label, exact: true }).click();
						const response = contentResponse('POST', '/publish');
						await page
							.getByRole('dialog')
							.getByRole('button', { name: label, exact: true })
							.click();
						assert.equal((await response).status(), 200);
					};
					const publicRead = async () => {
						const response = await context.request.get(origin + '/');
						return {
							status: response.status(),
							text: await response.text(),
							headers: response.headers()
						};
					};
					await t.test(
						'manual Save persists a draft without leaking it publicly, then explicit publish changes the public route',
						async () => {
							const headline = page.getByLabel('Headline', { exact: true });
							assert.equal(await headline.inputValue(), baseline.hero.headline);
							const saved = contentResponse('PUT');
							await headline.fill('Browser editor draft');
							await page.getByRole('button', { name: 'Save', exact: true }).click();
							assert.equal((await saved).status(), 200);
							assert.equal((await request('load')).body.hero.headline, baseline.hero.headline);
							const unchanged = await publicRead();
							assert.equal(unchanged.status, 200);
							assert.ok(unchanged.text.includes(baseline.hero.headline));
							assert.ok(!unchanged.text.includes('Browser editor draft'));
							await page.reload();
							assert.equal(await headline.inputValue(), 'Browser editor draft');
							await publish('Publish changes');
							assert.equal((await request('load')).body.hero.headline, 'Browser editor draft');
							const visible = await publicRead();
							assert.equal(visible.status, 200);
							assert.ok(visible.text.includes('Browser editor draft'));
						}
					);
					await t.test(
						'unpublishing required content gives generic 503 and republishing restores the page',
						async () => {
							const response = contentResponse('POST', '/unpublish');
							await page.getByRole('button', { name: /^Unpublish / }).click();
							assert.equal((await response).status(), 200);
							const unavailable = await publicRead();
							assert.equal(unavailable.status, 503);
							assert.equal(unavailable.headers['x-robots-tag'], 'noindex');
							assert.ok(unavailable.text.includes('Portfolio is temporarily unavailable.'));
							assert.ok(!unavailable.text.includes('Browser editor draft'));
							await publish('Publish now');
							assert.equal((await publicRead()).status, 200);
						}
					);
					await t.test(
						'policy rejection shows a save error and preserves the stored data',
						async () => {
							const path = origin + '/_emdash/api/content/portfolio_home/portfolio-v1:home';
							const initial = await context.request.get(path, { headers: await sessionHeaders() });
							assert.equal(initial.status(), 200, await initial.text());
							const before = (await initial.json()).data.item.data;
							const denied = contentResponse('PUT');
							await page.getByLabel('Display position', { exact: true }).fill('99');
							await page.getByRole('button', { name: 'Save', exact: true }).click();
							assert.equal((await denied).status(), 500);
							await page
								.getByText('A plugin hook failed while saving content', { exact: false })
								.first()
								.waitFor();
							assert.deepEqual(
								(
									await (
										await context.request.get(path, { headers: await sessionHeaders() })
									).json()
								).data.item.data,
								before
							);
							// Leave the rejected dirty form by reloading; never alter the application policy.
							await page.reload();
						}
					);
					await t.test(
						'media picker selects and replaces ready local images, publishing controls their public use',
						async () => {
							const uploaded = [];
							for (const [name, bytes] of [
								['browser-red.png', testPng(255, 0, 0)],
								['browser-green.png', testPng(0, 255, 0)]
							]) {
								const response = await context.request.post(origin + '/_emdash/api/media', {
									headers: { 'X-EmDash-Request': '1', ...(await sessionHeaders()) },
									multipart: {
										file: { name, mimeType: 'image/png', buffer: bytes },
										width: '1',
										height: '1'
									}
								});
								assert.equal(response.status(), 201);
								const item = (await response.json()).data.item;
								const metadata = await context.request.put(
									origin + '/_emdash/api/media/' + item.id,
									{
										headers: { 'X-EmDash-Request': '1', ...(await sessionHeaders()) },
										data: { alt: 'Synthetic ' + name }
									}
								);
								assert.equal(metadata.status(), 200);
								uploaded.push((await metadata.json()).data.item);
							}
							const id = 'portfolio-v1:projects:windows-pc-hardware';
							await page.goto(origin + '/_emdash/admin/content/portfolio_projects/' + id);
							const projectResponse = (method, suffix = '') =>
								page.waitForResponse(
									(r) =>
										r.request().method() === method &&
										new URL(r.url()).pathname.endsWith(id + suffix)
								);
							const saveImage = async (label, item) => {
								await page.getByRole('button', { name: label, exact: true }).click();
								const dialog = page.getByRole('dialog');
								await dialog.getByRole('button', { name: item.filename, exact: true }).click();
								const saved = projectResponse('PUT');
								await dialog
									.getByRole('button', {
										name: label === 'Select image' ? 'Select' : 'Replace',
										exact: true
									})
									.click();
								// Explicit Save rather than relying on the timed autosave.
								await page.getByRole('button', { name: 'Save', exact: true }).click();
								assert.equal((await saved).status(), 200);
							};
							const publishProject = async () => {
								await page.getByRole('button', { name: 'Publish changes', exact: true }).click();
								const response = projectResponse('POST', '/publish');
								await page
									.getByRole('dialog')
									.getByRole('button', { name: 'Publish changes', exact: true })
									.click();
								assert.equal((await response).status(), 200);
							};
							await saveImage('Select image', uploaded[0]);
							assert.equal((await request('load')).body.projects[0].image, undefined);
							await publishProject();
							assert.ok(
								(await request('load')).body.projects[0].image.src.endsWith(uploaded[0].storageKey)
							);
							await saveImage('Replace', uploaded[1]);
							assert.ok(
								(await request('load')).body.projects[0].image.src.endsWith(uploaded[0].storageKey)
							);
							await publishProject();
							assert.ok(
								(await request('load')).body.projects[0].image.src.endsWith(uploaded[1].storageKey)
							);
						}
					);
				} finally {
					await context.close();
				}
			});
		} finally {
			await browser.close();
		}
	}
);
