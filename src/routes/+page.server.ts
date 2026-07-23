import { buildCanvasDocument, getPortfolioContent } from '$lib/features/portfolio-content';

export const prerender = true;

export function load() {
	const content = getPortfolioContent();
	return { content, canvas: buildCanvasDocument(content) };
}
