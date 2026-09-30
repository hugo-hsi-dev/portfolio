// Copied ONLY by d1-harness.mjs into a disposable app. Never a production route.
/* eslint-disable @typescript-eslint/no-explicit-any -- Disposable runtime probe accepts dynamic CMS collections and JSON operations. */
import { getDb } from 'emdash/runtime';
import { runMigrations } from 'emdash/db';
import { importPortfolioDrafts } from '../../../migration/portfolio/import-drafts';
import { loadPortfolio } from '../../lib/server/portfolio';

export const prerender = false;

export async function POST({ request, locals }: any) {
	if (request.headers.get('x-test-token') !== '__TEST_TOKEN__')
		return new Response(null, { status: 404 });
	const { operation, collection, id, data, body } = await request.json();
	const json = (value: unknown, status = 200) => Response.json(value ?? null, { status });
	try {
		const db = await getDb();
		const runtime = locals.emdash;
		switch (operation) {
			case 'migrate':
				return json(await runMigrations(db));
			case 'import':
				return json(await importPortfolioDrafts(db));
			case 'load':
				return json(await loadPortfolio());
			case 'snapshot': {
				const snapshot: Record<string, unknown> = {};
				for (const name of [
					'home',
					'projects',
					'experience',
					'education',
					'skill_groups',
					'contacts'
				]) {
					snapshot[name] = await db
						.selectFrom(`ec_portfolio_${name}` as any)
						.selectAll()
						.orderBy('id' as any)
						.execute();
				}
				return json(snapshot);
			}
			case 'audit':
				return json({ users: (await db.selectFrom('users').select('id').execute()).length });
			case 'update':
				return json(await runtime.handleContentUpdate(collection, id, { data, ...body }));
			case 'create':
				return json(await runtime.handleContentCreate(collection, body));
			case 'publish':
				return json(await runtime.handleContentPublish(collection, id));
			case 'unpublish':
				return json(await runtime.handleContentUnpublish(collection, id));
			case 'delete':
				return json(await runtime.handleContentDelete(collection, id));
			case 'media-upload':
				if (typeof body?.base64 !== 'string' || body.url !== undefined)
					return json({ error: 'base64-only' }, 400);
				return json(await runtime.handleMediaUpload(body));
			case 'media-get':
				return json(await runtime.handleMediaGet(id));
			default:
				return json({ error: 'unknown-operation' }, 400);
		}
	} catch (error: any) {
		return json({ error: error.code ?? error.name, message: error.message }, 503);
	}
}
