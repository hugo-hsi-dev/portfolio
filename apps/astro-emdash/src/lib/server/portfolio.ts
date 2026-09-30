import { getEmDashCollection, MediaRepository } from 'emdash';
import { getDb } from 'emdash/runtime';
import { assemblePortfolio, PortfolioUnavailableError, type Portfolio } from './portfolio-model';
import schema from '../../../migration/portfolio/schema.seed.json';

export { PortfolioUnavailableError };
export type { Portfolio } from './portfolio-model';

/** Request-local published reads only. Never accepts a preview/status filter from callers. */
export async function loadPortfolio(): Promise<Portfolio> {
	try {
		const collections = await Promise.all(
			schema.collections.map(async ({ slug }) => {
				const result = await getEmDashCollection(slug, {
					status: 'published',
					locale: 'en',
					orderBy: { position: 'asc' }
				});
				if (result.error) throw new PortfolioUnavailableError('unavailable');
				if (result.hasMore) throw new PortfolioUnavailableError('invalid');
				return [slug, result.entries.map((entry) => ({ ...entry.data }))] as const;
			})
		);
		const content = Object.fromEntries(collections);
		// Local editor values are ID references, often without src. Resolve against ready
		// CMS media rather than trusting stale metadata or inventing a URL from the ID.
		for (const row of content.portfolio_projects ?? []) {
			const image = row.image;
			if (!image || typeof image !== 'object' || Array.isArray(image)) continue;
			const value = image as Record<string, unknown>;
			if (value.provider !== 'local' && value.provider !== undefined) continue;
			if (typeof value.id !== 'string') throw new PortfolioUnavailableError('invalid');
			const item = await new MediaRepository(await getDb()).findById(value.id);
			if (!item || item.status !== 'ready' || !item.mimeType.startsWith('image/'))
				throw new PortfolioUnavailableError('invalid');
			row.image = {
				...value,
				provider: 'local',
				src: `/_emdash/api/media/file/${item.storageKey}`
			};
		}
		return assemblePortfolio(content);
	} catch (error) {
		if (error instanceof PortfolioUnavailableError) throw error;
		// Neither driver exceptions nor connection details become public error messages.
		throw new PortfolioUnavailableError('unavailable');
	}
}
