import { SchemaRegistry } from 'emdash';
import type { getDb } from 'emdash/runtime';
import { applySeed, validateSeed, type SeedFile } from 'emdash/seed';
import { createDraftSeed } from './seed.mjs';

type Db = Awaited<ReturnType<typeof getDb>>;
type Row = Record<string, unknown>;
type Action = { collection: string; id: string; action: 'create' | 'noop' | 'conflict' };
const canonical = (value: unknown): string => {
	if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
	if (value && typeof value === 'object')
		return `{${Object.entries(value)
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`)
			.join(',')}}`;
	return JSON.stringify(value);
};

/** Fixed baseline only: no user-supplied file, remote fetch, publication or update mode. */
export async function planPortfolioDrafts(db: Db) {
	const seed = createDraftSeed() as SeedFile;
	const valid = validateSeed(seed);
	if (!valid.valid) throw new Error('Portfolio seed validation failed');
	const registry = new SchemaRegistry(db);
	const actions: Action[] = [];
	for (const collection of seed.collections ?? []) {
		const existing = await registry.getCollectionWithFields(collection.slug);
		if (existing) {
			if (
				existing.routable ||
				canonical(existing.supports) !== canonical(collection.supports) ||
				existing.commentsEnabled
			)
				throw new Error(`Portfolio schema drift: ${collection.slug}`);
			if (existing.fields.length !== collection.fields.length)
				throw new Error(`Portfolio field drift: ${collection.slug}`);
			for (const field of collection.fields) {
				const stored = existing.fields.find((item) => item.slug === field.slug);
				if (
					!stored ||
					stored.type !== field.type ||
					stored.required !== (field.required ?? false) ||
					stored.unique !== (field.unique ?? false) ||
					stored.indexed !== (field.indexed ?? false) ||
					stored.translatable !== (field.translatable ?? true) ||
					canonical(stored.validation ?? {}) !== canonical(field.validation ?? {})
				)
					throw new Error(`Portfolio field drift: ${collection.slug}.${field.slug}`);
			}
		}
		// Version-pinned raw reads preserve exact text, unlike generic JSON heuristics in the loader.
		const rows = existing
			? ((await db
					.selectFrom(`ec_${collection.slug}` as never)
					.selectAll()
					.execute()) as Row[])
			: [];
		const entries = seed.content?.[collection.slug] ?? [];
		const known = new Set(entries.map((entry) => entry.id));
		if (rows.some((row) => !known.has(String(row.id))))
			throw new Error(`Unexpected portfolio identities: ${collection.slug}`);
		for (const entry of entries) {
			const row = rows.find((row) => row.id === entry.id);
			const collision = rows.some((row) => row.external_id === entry.id && row.id !== entry.id);
			const data =
				row &&
				Object.fromEntries(
					collection.fields
						.map((field) => {
							let value = row[field.slug];
							if (typeof value === 'string' && ['image', 'repeater'].includes(field.type))
								value = JSON.parse(value);
							return [field.slug, value];
						})
						.filter(([, value]) => value != null)
				);
			const unchanged =
				row &&
				canonical(data) === canonical(entry.data) &&
				row.status === 'draft' &&
				row.slug === null &&
				row.locale === 'en' &&
				row.deleted_at === null &&
				row.live_revision_id === null &&
				row.draft_revision_id === null;
			actions.push({
				collection: collection.slug,
				id: entry.id,
				action: collision || (row && !unchanged) ? 'conflict' : row ? 'noop' : 'create'
			});
		}
	}
	return {
		actions,
		creates: actions.filter((action) => action.action === 'create').length,
		noops: actions.filter((action) => action.action === 'noop').length,
		conflicts: actions.filter((action) => action.action === 'conflict').length
	};
}

/**
 * Called only by the disposable D1 test harness. No route/CLI in the real app exposes this.
 * Single-writer rehearsal: preflight all collections before writes; retries resume missing IDs.
 * D1 does not promise a transaction spanning the whole seed. Do not use against a live editor DB.
 */
export async function importPortfolioDrafts(db: Db) {
	const before = await planPortfolioDrafts(db);
	if (before.conflicts) throw new Error('Portfolio import conflicts; no writes applied');
	if (!before.creates) return { applied: false, plan: before };
	const result = await applySeed(db, createDraftSeed() as SeedFile, {
		includeContent: true,
		onConflict: 'skip'
	});
	const after = await planPortfolioDrafts(db);
	if (after.creates || after.conflicts) throw new Error('Portfolio import verification failed');
	return { applied: true, plan: before, result };
}
