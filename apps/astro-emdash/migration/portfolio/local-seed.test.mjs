import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';
import { baseline, createDraftSeed, schemaSeed } from './seed.mjs';
import { withLocalSeedSandbox } from './local-seed.mjs';

const packageRoot =
	process.env.PORTFOLIO_EMDASH_PACKAGE_ROOT ?? fileURLToPath(new URL('../../', import.meta.url));
let installed = false;
try {
	createRequire(pathToFileURL(resolve(packageRoot, 'package.json'))).resolve('emdash/seed');
	installed = true;
} catch (error) {
	if (process.env.PORTFOLIO_EMDASH_PACKAGE_ROOT) throw error;
}

test('draft seed is deterministic, excludes runtime policy and retains ordered source text', () => {
	const first = createDraftSeed();
	assert.deepEqual(first, createDraftSeed());
	assert.equal(Object.values(first.content).flat().length, 17);
	assert.equal(first.content.portfolio_home[0].data.headline, baseline.hero.headline);
	assert.ok(first.collections.every((collection) => collection.routable === false));
	assert.equal(
		schemaSeed.content,
		undefined,
		'Discovered schema must never publish or populate content'
	);
	for (const entries of Object.values(first.content))
		for (const entry of entries) {
			assert.equal(entry.status, 'draft');
			assert.equal(entry.slug, null);
			assert.equal(entry.data.external_id, entry.id);
			assert.equal(entry.data.canonical, undefined);
			assert.equal(entry.data.credit, undefined);
		}
	first.content.portfolio_projects.forEach((entry, position) => {
		const project = baseline.projects[position];
		assert.equal(entry.data.description, project.description);
		assert.deepEqual(
			entry.data.technologies.map((row) => row.value),
			project.technologies
		);
		assert.equal(entry.data.image?.src, project.image?.src);
		assert.equal(entry.data.image?.alt, project.image?.alt);
	});
});

test(
	'EmDash 1.0.1 validates, imports and repeats safely in disposable SQLite',
	{
		skip: installed
			? false
			: 'Install the foundation dependencies or set PORTFOLIO_EMDASH_PACKAGE_ROOT to a disposable package directory'
	},
	async (t) => {
		const previousFetch = globalThis.fetch;
		await withLocalSeedSandbox(packageRoot, async ({ plan, apply, snapshot, db, validateSeed }) => {
			await t.test('official schema validator accepts all six collections without warnings', () => {
				assert.deepEqual(validateSeed(schemaSeed), { valid: true, errors: [], warnings: [] });
				assert.deepEqual(validateSeed(createDraftSeed()), {
					valid: true,
					errors: [],
					warnings: []
				});
			});
			await t.test('dry-run is read-only and fetch is blocked', async () => {
				const before = await snapshot();
				assert.equal((await plan()).creates, 17);
				assert.deepEqual(await snapshot(), before);
				await assert.rejects(fetch('https://example.com'), /Network fetch is disabled/);
			});
			await t.test(
				'first import creates draft-only content and second import performs zero writes',
				async () => {
					const first = await apply();
					assert.equal(first.result.collections.created, 6);
					assert.equal(first.result.fields.created, 46);
					assert.equal(first.result.content.created, 17);
					assert.equal(first.result.media.created, 0);
					const rows = await snapshot();
					for (const row of Object.values(rows).flat()) {
						assert.equal(row.id, row.external_id);
						assert.equal(row.status, 'draft');
						assert.equal(row.published_at, null);
						assert.equal(row.live_revision_id, null);
					}
					const second = await apply();
					assert.equal(second.applied, false);
					assert.equal(second.plan.creates, 0);
					assert.equal(second.plan.noops, 17);
					assert.deepEqual(await snapshot(), rows, 'No timestamps or versions changed');
				}
			);
			await t.test(
				'changed source payload and manual edits block all writes including missing records',
				async () => {
					const changed = createDraftSeed();
					changed.content.portfolio_home[0].data.headline = 'Changed';
					assert.equal((await plan(changed)).conflicts, 1);
					const before = await snapshot();
					await assert.rejects(apply(changed), /Conflicting manual edits/);
					assert.deepEqual(await snapshot(), before);
					await db
						.deleteFrom('ec_portfolio_projects')
						.where('id', '=', 'portfolio-v1:projects:arch-linux')
						.execute();
					await db
						.updateTable('ec_portfolio_home')
						.set({ headline: 'Manual edit' })
						.where('id', '=', 'portfolio-v1:home')
						.execute();
					const edited = await snapshot();
					const summary = await plan();
					assert.equal(summary.creates, 1);
					assert.equal(summary.conflicts, 1);
					await assert.rejects(apply(), /Conflicting manual edits/);
					assert.deepEqual(await snapshot(), edited);
					await db
						.updateTable('ec_portfolio_home')
						.set({ headline: baseline.hero.headline })
						.where('id', '=', 'portfolio-v1:home')
						.execute();
				}
			);
			await t.test(
				'interrupted import resumes missing IDs without updating existing rows',
				async () => {
					const before = await snapshot();
					const result = await apply();
					assert.equal(result.result.content.created, 1);
					assert.equal(result.result.content.updated, 0);
					assert.equal(result.result.content.skipped, 16);
					const after = await snapshot();
					for (const [collection, rows] of Object.entries(before))
						for (const row of rows)
							assert.deepEqual(
								after[collection].find((item) => item.id === row.id),
								row
							);
				}
			);
			await t.test(
				'duplicate IDs, publication, remote media and schema changes are rejected before writes',
				async () => {
					const before = await snapshot();
					const duplicate = createDraftSeed();
					duplicate.content.portfolio_projects.push(duplicate.content.portfolio_projects[0]);
					await assert.rejects(apply(duplicate), /Duplicate seed identity/);
					const published = createDraftSeed();
					published.content.portfolio_home[0].status = 'published';
					await assert.rejects(apply(published), /Publication is not an import operation/);
					const remote = createDraftSeed();
					remote.content.portfolio_projects[2].data.image.src = 'https://example.com/image.png';
					await assert.rejects(apply(remote), /Only known static project images/);
					const schema = createDraftSeed();
					schema.collections[0].fields[2].type = 'json';
					await assert.rejects(apply(schema), /Schema drift/);
					assert.deepEqual(await snapshot(), before);
				}
			);
			await t.test('identity collisions are not treated as new records', async () => {
				await db
					.updateTable('ec_portfolio_projects')
					.set({ id: 'unexpected-id' })
					.where('id', '=', 'portfolio-v1:projects:arch-linux')
					.execute();
				const before = await snapshot();
				assert.equal((await plan()).conflicts, 1);
				await assert.rejects(apply(), /Conflicting manual edits/);
				assert.deepEqual(await snapshot(), before);
			});
			await t.test('stored schema edits stop import', async () => {
				await db
					.updateTable('_emdash_collections')
					.set({ label: 'Changed' })
					.where('slug', '=', 'portfolio_home')
					.execute();
				await assert.rejects(plan(), /Stored schema was edited/);
			});
		});
		assert.equal(globalThis.fetch, previousFetch);
	}
);

test(
	'bracket-prefixed plain text survives import and repeated no-op verification',
	{
		skip: installed ? false : 'EmDash 1.0.1 dependencies are not installed'
	},
	async () => {
		await withLocalSeedSandbox(packageRoot, async ({ apply, snapshot }) => {
			const seed = createDraftSeed();
			seed.content.portfolio_home[0].data.description = '[Independent designer]';
			seed.content.portfolio_home[0].data.aside = '{"literal":"text"}';
			const first = await apply(seed);
			assert.equal(first.result.content.created, 17);
			const before = await snapshot();
			assert.equal(before.portfolio_home[0].description, '[Independent designer]');
			assert.equal(before.portfolio_home[0].aside, '{"literal":"text"}');
			const second = await apply(seed);
			assert.equal(second.applied, false);
			assert.equal(second.plan.noops, 17);
			assert.deepEqual(await snapshot(), before);
		});
	}
);
