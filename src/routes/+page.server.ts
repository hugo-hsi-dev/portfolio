import { getPortfolioContent } from '$lib/server/content';

export function load() {
	return getPortfolioContent();
}
