import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { baseline, createDraftSeed, schemaSeed } from './seed.mjs';

function canonical(value) {
	if (Array.isArray(value)) return value.map(canonical);
	if (value && typeof value === 'object')
		return Object.fromEntries(
			Object.keys(value)
				.sort()
				.map((key) => [key, canonical(value[key])])
		);
	return value;
}
const checksum = (value) =>
	createHash('sha256')
		.update(JSON.stringify(canonical(value)))
		.digest('hex');

function assertLocalSeed(seed, validateSeed) {
	assert.deepEqual(Object.keys(seed).sort(), [
		'collections',
		'content',
		'defaultLocale',
		'meta',
		'version'
	]);
	assert.deepEqual(
		seed.collections,
		schemaSeed.collections,
		'Schema drift requires a reviewed schema migration'
	);
	assert.equal(seed.version, '1');
	assert.equal(seed.defaultLocale, 'en');
	assert.deepEqual(
		Object.keys(seed.content).sort(),
		schemaSeed.collections.map((collection) => collection.slug).sort()
	);
	assert.equal(seed.content.portfolio_home.length, 1);
	const ids = new Set();
	for (const collection of seed.collections) {
		const fields = new Set(collection.fields.map((field) => field.slug));
		for (const entry of seed.content[collection.slug]) {
			assert.match(entry.id, /^portfolio-v1:[a-zA-Z0-9:-]+$/);
			assert.ok(!ids.has(entry.id), 'Duplicate seed identity');
			ids.add(entry.id);
			assert.equal(entry.slug, null, 'Only slugless identities are supported');
			assert.equal(entry.locale, 'en');
			assert.equal(entry.status, 'draft', 'Publication is not an import operation');
			assert.equal(entry.data.external_id, entry.id);
			assert.ok(Number.isInteger(entry.data.position) && entry.data.position >= 0);
			for (const key of Object.keys(entry.data)) assert.ok(fields.has(key), `Unknown field ${key}`);
			for (const field of collection.fields.filter((field) => field.required))
				assert.notEqual(entry.data[field.slug], undefined, `Missing field ${field.slug}`);
			if (entry.data.image) {
				assert.equal(entry.data.image.provider, 'external');
				assert.ok(
					baseline.projects.some((project) => project.image?.src === entry.data.image.src),
					'Only known static project images are allowed'
				);
			}
		}
	}
	const visit = (value) => {
		if (value && typeof value === 'object')
			for (const [key, child] of Object.entries(value)) {
				assert.ok(
					key !== '$media' && key !== '$ref',
					'Media downloads/references are not supported by this local rehearsal'
				);
				visit(child);
			}
	};
	visit(seed);
	const result = validateSeed(seed);
	assert.equal(result.valid, true, result.errors.join('\n'));
	return result;
}

/**
 * Uses only a fresh in-memory SQLite database. No database URL/path, bindings, storage,
 * credentials, publication or persistent-target mode exists. packageRoot selects installed
 * code only (the foundation app or a disposable dependency directory).
 */
export async function withLocalSeedSandbox(packageRoot, callback) {
	const require = createRequire(pathToFileURL(resolve(packageRoot, 'package.json')));
	const seedPath = require.resolve('emdash/seed');
	const packagePath = resolve(dirname(seedPath), '../../package.json');
	assert.equal(
		JSON.parse(readFileSync(packagePath, 'utf8')).version,
		'1.0.1',
		'Re-audit before changing EmDash versions'
	);
	const emdashRequire = createRequire(pathToFileURL(seedPath));
	const load = (name) => import(pathToFileURL(emdashRequire.resolve(name)).href);
	const { Kysely } = await load('kysely');
	const { createDialect } = await load('emdash/db/sqlite');
	const { runMigrations } = await load('emdash/db');
	const { applySeed, validateSeed } = await load('emdash/seed');
	const db = new Kysely({ dialect: createDialect({ url: ':memory:' }) });
	const originalFetch = globalThis.fetch;
	globalThis.fetch = async () => {
		throw new Error('Network fetch is disabled in the local seed sandbox');
	};
	let schemaFingerprint;
	const storedSchema = async () => ({
		collections: await db.selectFrom('_emdash_collections').selectAll().orderBy('slug').execute(),
		fields: await db.selectFrom('_emdash_fields').selectAll().orderBy('id').execute()
	});
	const snapshot = async () => {
		const tables = new Set((await db.introspection.getTables()).map((table) => table.name));
		const content = {};
		for (const collection of schemaSeed.collections) {
			const table = `ec_${collection.slug}`;
			content[collection.slug] = tables.has(table)
				? await db.selectFrom(table).selectAll().orderBy('id').execute()
				: [];
		}
		return content;
	};
	const plan = async (seed = createDraftSeed()) => {
		assertLocalSeed(seed, validateSeed);
		if (schemaFingerprint)
			assert.equal(
				checksum(await storedSchema()),
				schemaFingerprint,
				'Stored schema was edited; refusing import'
			);
		const current = await snapshot();
		const entries = [];
		for (const collection of seed.collections)
			for (const entry of seed.content[collection.slug]) {
				const rows = current[collection.slug];
				const row = rows.find((item) => item.id === entry.id);
				const identityCollision = rows.some(
					(item) => item.external_id === entry.id && item.id !== entry.id
				);
				const decode = (value, field) =>
					typeof value === 'string' && ['repeater', 'image'].includes(field.type)
						? JSON.parse(value)
						: value;
				const payload =
					row &&
					Object.fromEntries(
						collection.fields
							.map((field) => [field.slug, decode(row[field.slug], field)])
							.filter(([, value]) => value !== null && value !== undefined)
					);
				const same =
					row &&
					checksum(payload) === checksum(entry.data) &&
					row.status === 'draft' &&
					row.slug === null &&
					row.locale === entry.locale &&
					row.deleted_at === null &&
					row.live_revision_id === null &&
					row.draft_revision_id === null;
				entries.push({
					collection: collection.slug,
					externalId: entry.id,
					checksum: checksum(entry.data),
					action: identityCollision || (row && !same) ? 'conflict' : row ? 'noop' : 'create'
				});
			}
		return {
			entries,
			creates: entries.filter((entry) => entry.action === 'create').length,
			noops: entries.filter((entry) => entry.action === 'noop').length,
			conflicts: entries.filter((entry) => entry.action === 'conflict').length
		};
	};
	const apply = async (seed = createDraftSeed()) => {
		const before = await plan(seed);
		assert.equal(before.conflicts, 0, 'Conflicting manual edits or identities; no writes applied');
		if (before.creates === 0) return { plan: before, applied: false };
		const result = await applySeed(db, seed, { includeContent: true, onConflict: 'skip' });
		schemaFingerprint = checksum(await storedSchema());
		const after = await plan(seed);
		assert.equal(after.noops, before.entries.length, 'Post-import verification failed');
		assert.equal(after.conflicts, 0);
		return { plan: before, applied: true, result };
	};
	try {
		await runMigrations(db);
		return await callback({ plan, apply, snapshot, db, validateSeed });
	} finally {
		globalThis.fetch = originalFetch;
		await db.destroy();
	}
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
	const args = process.argv.slice(2);
	if (args.length !== 2 || args[0] !== '--disposable-local-only') {
		throw new Error('Usage: node local-seed.mjs --disposable-local-only <installed-app-directory>');
	}
	await withLocalSeedSandbox(args[1], async ({ plan, apply }) => {
		const before = await plan();
		const first = await apply();
		const second = await apply();
		console.log(
			JSON.stringify(
				{
					target: 'disposable in-memory SQLite (destroyed on exit)',
					before,
					first: first.result,
					second
				},
				null,
				2
			)
		);
	});
}
