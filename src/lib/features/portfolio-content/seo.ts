import type { PortfolioContent } from './loader';

type SiteDocument = PortfolioContent['site'];
type ProjectDocument = PortfolioContent['projects'][number];
type TechnologyDocument = PortfolioContent['technologies'];

export function socialImageUrl(site: SiteDocument): string {
	return new URL(site.metadata.seo.image, site.metadata.seo.canonicalUrl).href;
}

export function buildStructuredDataJson(
	site: SiteDocument,
	projects: ProjectDocument[],
	technologies: TechnologyDocument
): string {
	const metadata = site.metadata;
	const sameAs = [metadata.contact.github, metadata.contact.linkedin].filter(
		(value): value is string => Boolean(value)
	);
	const knowsAbout = Array.from(
		new Set(
			(['frontend', 'backend', 'database', 'tools'] as const).flatMap(
				(category) => technologies.metadata[category]
			)
		)
	);

	return JSON.stringify({
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'Person',
				name: `${metadata.hero.firstName} ${metadata.hero.lastName}`,
				jobTitle: metadata.seo.jobTitle,
				email: metadata.contact.email,
				url: metadata.seo.canonicalUrl,
				sameAs,
				knowsAbout
			},
			{
				'@type': 'WebSite',
				name: `${metadata.hero.firstName} ${metadata.hero.lastName} Portfolio`,
				url: metadata.seo.canonicalUrl,
				description: metadata.seo.description
			},
			{
				'@type': 'ItemList',
				name: 'Selected Projects',
				itemListElement: projects.map((project, index) => ({
					'@type': 'ListItem',
					position: index + 1,
					item: {
						'@type': 'CreativeWork',
						name: project.metadata.title,
						description: project.metadata.excerpt,
						url: project.metadata.liveUrl,
						keywords: project.metadata.technologies
					}
				}))
			}
		]
	}).replaceAll('<', '\\u003c');
}
