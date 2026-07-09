import { describe, expect, it } from 'vitest';
import { buildPortfolioContent, getPortfolioContent, parseMarkdownDocument } from './content';

describe('parseMarkdownDocument', () => {
	it('parses JSON frontmatter and Markdown body', () => {
		expect.assertions(3);

		const doc = parseMarkdownDocument<{ title: string }>(
			`---
{"title":"Hello"}
---
# Hello **world**`
		);

		expect(doc.metadata.title).toBe('Hello');
		expect(doc.body).toBe('# Hello **world**');
		expect(doc.html).toContain('<h1>Hello <strong>world</strong></h1>');
	});

	it('fails on invalid JSON frontmatter', () => {
		expect.assertions(1);

		expect(() =>
			parseMarkdownDocument(`---
{title:"Hello"}
---
Body`)
		).toThrow('Invalid JSON frontmatter');
	});
});

describe('buildPortfolioContent', () => {
	it('sorts collections and preserves technology groups', () => {
		expect.assertions(5);

		const content = buildPortfolioContent({
			site: frontmatter({
				hero: {
					firstName: 'Hugo',
					lastName: 'Hsi',
					tagline: 'Tagline',
					ctaPrimary: { text: 'Work', link: '#projects' }
				},
				contact: { email: 'hello@example.com' },
				footer: { heading: 'Hi', intro: 'Intro', builtWith: 'Built' }
			}),
			technologies: frontmatter({
				frontend: ['Svelte'],
				backend: ['TypeScript'],
				database: ['PostgreSQL'],
				tools: ['Git']
			}),
			projects: {
				'/src/content/projects/b.md': frontmatter({
					title: 'B',
					excerpt: 'B',
					context: 'work',
					order: 2,
					technologies: []
				}),
				'/src/content/projects/a.md': frontmatter({
					title: 'A',
					excerpt: 'A',
					context: 'personal',
					order: 1,
					technologies: []
				})
			},
			experience: {
				'/src/content/experience/old.md': frontmatter({
					company: 'Old',
					role: 'Dev',
					startDate: '2020-01-01'
				}),
				'/src/content/experience/new.md': frontmatter({
					company: 'New',
					role: 'Dev',
					startDate: '2023-01-01'
				})
			},
			education: {
				'/src/content/education/school.md': frontmatter({
					institution: 'School',
					degree: 'BFA',
					startDate: '2015-01-01'
				})
			},
			lab: {
				'/src/content/lab/z.md': frontmatter({
					name: 'Zed',
					description: 'Zed',
					technologies: 'TypeScript'
				}),
				'/src/content/lab/a.md': frontmatter({
					name: 'Alpha',
					description: 'Alpha',
					technologies: 'Svelte'
				})
			}
		});

		expect(content.projects.map((project) => project.slug)).toEqual(['a', 'b']);
		expect(content.experience.map((item) => item.metadata.company)).toEqual(['New', 'Old']);
		expect(content.education[0].metadata.institution).toBe('School');
		expect(content.lab.map((item) => item.metadata.name)).toEqual(['Alpha', 'Zed']);
		expect(content.technologies.metadata.frontend).toEqual(['Svelte']);
	});
});

describe('getPortfolioContent', () => {
	it('loads the checked-in Markdown content', () => {
		expect.assertions(4);

		const content = getPortfolioContent();

		expect(content.site.metadata.hero.firstName).toBe('Hugo');
		expect(content.projects.map((project) => project.slug)).toEqual([
			'national-medal-of-honor-museum',
			'1st-avenue-advisors',
			'minecentral'
		]);
		expect(content.lab[0].metadata.name).toBe('Color Palette Gen');
		expect(content.technologies.metadata.tools).toContain('Git');
	});
});

function frontmatter(metadata: unknown, body = '') {
	return `---
${JSON.stringify(metadata)}
---
${body}`;
}
