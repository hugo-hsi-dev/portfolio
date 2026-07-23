import { describe, expect, it } from 'vitest';

import { buildStructuredDataJson } from './seo';

describe('portfolio content SEO', () => {
	it('deduplicates technologies and escapes markup-sensitive characters', () => {
		const site = {
			metadata: {
				hero: {
					firstName: 'Hugo',
					lastName: '<Hsi>',
					tagline: '',
					intro: '',
					ctaPrimary: { text: '', link: '' }
				},
				contact: {
					email: 'hugo@example.com',
					github: 'https://github.com/hugo',
					linkedin: 'https://linkedin.com/in/hugo'
				},
				footer: { heading: '', intro: '', builtWith: '' },
				seo: {
					title: '',
					description: 'Portfolio',
					canonicalUrl: 'https://example.com',
					image: '/social.jpg',
					imageAlt: '',
					keywords: [],
					themeColor: '#fff',
					jobTitle: 'Developer'
				}
			},
			slug: 'site'
		};
		const projects = [
			{
				slug: 'project',
				metadata: {
					title: 'Project',
					excerpt: 'Excerpt',
					context: 'personal' as const,
					order: 1,
					technologies: ['Svelte'],
					liveUrl: 'https://example.com/project'
				}
			}
		];
		const technologies = {
			slug: 'technologies',
			metadata: {
				frontend: ['Svelte'],
				backend: ['TypeScript'],
				database: ['SQLite'],
				tools: ['TypeScript']
			}
		};

		const json = buildStructuredDataJson(site, projects, technologies);
		expect(json).not.toContain('<');
		expect(JSON.parse(json)['@graph'][0].knowsAbout).toEqual(['Svelte', 'TypeScript', 'SQLite']);
	});
});
