// TEMPLATE ONLY: admin-harness.mjs copies this into a disposable local app.
// Never install this route in the real application's src directory.
import type { APIRoute } from 'astro';
import { OptionsRepository, UserRepository } from 'emdash';
import { runMigrations } from 'emdash/db';
import { getDb } from 'emdash/runtime';
import type { SeedFile } from 'emdash/seed';
import { importPortfolioDrafts } from '../../../migration/portfolio/import-drafts';
import { createDraftSeed } from '../../../migration/portfolio/seed.mjs';
import { loadPortfolio } from '../../lib/server/portfolio';

export const prerender = false;

const identities = {
	editor: { email: 'editor@example.invalid', name: 'Synthetic Editor', role: 'editor' },
	subscriber: {
		email: 'subscriber@example.invalid',
		name: 'Synthetic Subscriber',
		role: 'subscriber'
	}
} as const;

const unavailable = () => Response.json({ error: 'fixture-unavailable' }, { status: 503 });
const invalid = () => Response.json({ error: 'invalid-operation' }, { status: 400 });

/**
 * POST with x-test-token and one exact JSON operation:
 * setup, identity (role: editor | subscriber), load, publish-baseline, or audit.
 * Content mutations under test must use the actual protected EmDash API routes.
 */
export const POST: APIRoute = async ({ request, locals, session }) => {
	if (request.headers.get('x-test-token') !== '__TEST_TOKEN__')
		return new Response(null, { status: 404 });

	let body: Record<string, unknown>;
	try {
		const parsed: unknown = await request.json();
		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return invalid();
		body = parsed as Record<string, unknown>;
	} catch {
		return invalid();
	}
	const operation = body.operation;
	if (
		!['setup', 'identity', 'load', 'publish-baseline', 'audit'].includes(String(operation)) ||
		Object.keys(body).some(
			(key) => key !== 'operation' && !(operation === 'identity' && key === 'role')
		) ||
		(operation === 'identity' && body.role !== 'editor' && body.role !== 'subscriber')
	)
		return invalid();

	try {
		if (operation === 'load') return Response.json(await loadPortfolio());
		const db = await getDb();
		const users = new UserRepository(db);
		switch (operation) {
			case 'setup': {
				const migrations = await runMigrations(db);
				const imported = await importPortfolioDrafts(db);
				await new OptionsRepository(db).set('emdash:setup_complete', true);
				return Response.json({ migrations, import: imported, setupComplete: true });
			}
			case 'identity': {
				if (!session) return unavailable();
				// Strict enumeration above is the only selector; no email, ID or role level input.
				const role = body.role as keyof typeof identities;
				const fixture = identities[role];
				const user = (await users.findByEmail(fixture.email)) ?? (await users.create(fixture));
				if (user.name !== fixture.name || user.role !== (role === 'editor' ? 40 : 10))
					return unavailable();
				// Astro persists this through its real cookie and configured SESSION KV store.
				// The next request resolves the user through EmDash's ordinary auth middleware.
				await session.set('user', { id: user.id });
				return Response.json({
					role,
					user: { id: user.id, email: user.email, name: user.name, role: user.role },
					session: true
				});
			}
			case 'publish-baseline': {
				const runtime = locals.emdash;
				if (!runtime) return unavailable();
				let published = 0;
				const seed = createDraftSeed() as SeedFile;
				// Explicit disposable setup operation, restricted to checked-in fixture IDs.
				for (const [collection, entries] of Object.entries(seed.content ?? {})) {
					for (const entry of entries) {
						const result = await runtime.handleContentPublish(collection, entry.id);
						if (!result.success) return unavailable();
						published++;
					}
				}
				return Response.json({ published });
			}
			case 'audit': {
				// EmDash 1.0.1 stores passkeys in credentials, not a passkeys table.
				const credentials = await db
					.selectFrom('credentials')
					.select((eb) => eb.fn.countAll<number>().as('count'))
					.executeTakeFirstOrThrow();
				return Response.json({ users: await users.count(), passkeys: Number(credentials.count) });
			}
			default:
				return invalid();
		}
	} catch {
		// Do not expose driver exceptions, connection details or identity/session data.
		return unavailable();
	}
};
