import { getPortfolioContent } from '$lib/server/content';

export const prerender = true;

export function load() {
	return getPortfolioContent();
}
