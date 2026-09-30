import type { MiddlewareHandler } from 'astro';
import schema from '../migration/portfolio/schema.seed.json' with { type: 'json' };

const managed = new Set(schema.collections.map((collection) => collection.slug));
const object = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

/** Exact EmDash 1.0.1 HTTP bypass routes; native hooks cover normal save/publication. */
export async function portfolioRequestRejection(request: Request): Promise<string | null> {
	if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return null;
	const url = new URL(request.url);
	let segments: string[];
	try {
		segments = url.pathname.split('/').filter(Boolean).map(decodeURIComponent);
	} catch {
		return null; // Invalid paths cannot identify one of the exact protected routes.
	}
	if (segments[0] !== '_emdash' || segments[1] !== 'api') return null;
	if (segments[2] === 'schema' && segments[3] === 'collections') {
		if (managed.has(segments[4])) return 'Portfolio schema is managed by the reviewed migration.';
		if (segments.length === 4 && request.method === 'POST') {
			const body: unknown = await request
				.clone()
				.json()
				.catch(() => null);
			if (object(body) && typeof body.slug === 'string' && managed.has(body.slug)) {
				return 'Portfolio schema is managed by the reviewed migration.';
			}
		}
		return null;
	}
	if (segments[2] !== 'content' || !managed.has(segments[3])) return null;
	if (url.searchParams.has('locale') && url.searchParams.get('locale') !== 'en') {
		return 'Portfolio locale is application-owned.';
	}
	if (segments.length === 4 && request.method === 'POST') {
		return 'Create portfolio records through the reviewed import.';
	}
	if (segments.length === 6 && segments[5] === 'duplicate' && request.method === 'POST') {
		return 'Portfolio record identities are fixed; duplication is disabled.';
	}
	if (segments.length === 6 && segments[5] === 'permanent' && request.method === 'DELETE') {
		return 'Portfolio records cannot be permanently deleted.';
	}
	if (segments.length === 5 && request.method === 'PUT') {
		const body: unknown = await request
			.clone()
			.json()
			.catch(() => null);
		if (!object(body)) return 'Portfolio updates require a JSON object.';
		if ('slug' in body && body.slug !== null && body.slug !== '') {
			return 'Portfolio slugs are application-owned.';
		}
		// Keep supported editor concurrency/autosave controls; lifecycle actions use their endpoints.
		const allowed = new Set(['data', '_rev', 'overrideLock', 'skipRevision', 'slug', 'status']);
		if (Object.keys(body).some((key) => !allowed.has(key))) {
			return 'Portfolio metadata is application-owned; edit content fields instead.';
		}
		if ('status' in body && body.status !== 'draft')
			return 'Use the publication action to publish.';
	}
	return null;
}

export const onRequest: MiddlewareHandler = async ({ request }, next) => {
	const reason = await portfolioRequestRejection(request);
	if (reason) {
		return Response.json(
			{ success: false, error: { code: 'PORTFOLIO_POLICY', message: reason } },
			{ status: 403, headers: { 'Cache-Control': 'private, no-store' } }
		);
	}
	return next();
};
