import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildPortfolioContent, getPortfolioContent, parseMarkdownDocument } from './content';

describe('parseMarkdownDocument', () => {
	it('parses JSON frontmatter and Markdown body', () => {
		expect.assertions(3);

		const doc = parseMarkdownDocument<{ title: string }>(`---
{"title":"Hello"}
---
# Hello **world**`);

		expect(doc.metadata.title).toBe('Hello');
		expect(doc.body).toBe('# Hello **world**');
		expect(doc.html).toContain('<h1>Hello <strong>world</strong></h1>');
	});

	it('fails when frontmatter fences are missing', () => {
		expect.assertions(1);
		expect(() => parseMarkdownDocument('# No frontmatter')).toThrow('Missing JSON frontmatter');
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
	it('sorts collections and permits empty optional collections', () => {
		expect.assertions(5);
		const sources = validSources();
		sources.projects = {
			'/src/content/projects/b.md': project({ title: 'B', order: 2 }),
			'/src/content/projects/a.md': project({ title: 'A', order: 1, context: 'personal' })
		};
		sources.experience = {
			'/src/content/experience/old.md': experience({ company: 'Old', startDate: '2020-01-01' }),
			'/src/content/experience/new.md': experience({ company: 'New', startDate: '2023-01-01' })
		};

		const content = buildPortfolioContent(sources);

		expect(content.projects.map((item) => item.slug)).toEqual(['a', 'b']);
		expect(content.experience.map((item) => item.metadata.company)).toEqual(['New', 'Old']);
		expect(content.education).toEqual([]);
		expect(content.lab).toEqual([]);
		expect(content.technologies.metadata.frontend).toEqual(['Svelte', 'React']);
	});

	it('reports the source path and invalid field', () => {
		expect.assertions(1);
		const sources = validSources();
		sources.projects = {
			'/src/content/projects/broken.md': frontmatter({
				title: 'Broken',
				excerpt: 'Broken project',
				context: 'personal',
				order: 'first',
				technologies: []
			})
		};

		expect(() => buildPortfolioContent(sources)).toThrow(
			'Invalid content in /src/content/projects/broken.md at order'
		);
	});

	it('requires a company for work projects', () => {
		expect.assertions(1);
		const sources = validSources();
		sources.projects = {
			'/src/content/projects/client.md': frontmatter({
				title: 'Client',
				excerpt: 'Client project',
				context: 'work',
				order: 1,
				technologies: []
			})
		};

		expect(() => buildPortfolioContent(sources)).toThrow(
			'company: is required when context is "work"'
		);
	});

	it('rejects invalid date ranges and current roles with end dates', () => {
		expect.assertions(2);
		const invalidRange = validSources();
		invalidRange.experience = {
			'/src/content/experience/range.md': experience({
				startDate: '2024-01-01',
				endDate: '2023-01-01'
			})
		};

		const invalidCurrent = validSources();
		invalidCurrent.experience = {
			'/src/content/experience/current.md': experience({
				isCurrent: true,
				endDate: '2024-01-01'
			})
		};

		expect(() => buildPortfolioContent(invalidRange)).toThrow(
			'endDate: must not be before startDate'
		);
		expect(() => buildPortfolioContent(invalidCurrent)).toThrow(
			'endDate: must be omitted when isCurrent is true'
		);
	});

	it('rejects duplicate project order values', () => {
		expect.assertions(1);
		const sources = validSources();
		sources.projects = {
			'/src/content/projects/a.md': project({ title: 'A', order: 1 }),
			'/src/content/projects/b.md': project({ title: 'B', order: 1, context: 'personal' })
		};

		expect(() => buildPortfolioContent(sources)).toThrow('order: must be unique');
	});
});

describe('getPortfolioContent', () => {
	it('loads only verified checked-in content', () => {
		expect.assertions(8);
		const content = getPortfolioContent();

		expect(content.site.metadata.hero.firstName).toBe('Hugo');
		expect(content.site.metadata.contact.linkedin).toBe('https://www.linkedin.com/in/hugo-hsi/');
		expect(content.projects.map((item) => item.slug)).toEqual([
			'national-medal-of-honor-museum',
			'1st-avenue-advisors',
			'minecentral',
			'me-save-money'
		]);
		expect(content.experience.map((item) => item.metadata.company)).toEqual([
			'Praxis Loop',
			'Lookout'
		]);
		expect(content.education.map((item) => item.metadata.institution)).toEqual([
			'Columbia University',
			'The New School'
		]);
		expect(content.experience[0].metadata).toMatchObject({
			role: 'Full Stack Developer (Contractor)',
			startDate: '2025-10-01',
			startDatePrecision: 'month',
			isCurrent: true
		});
		expect(content.experience[1].html).toContain(
			'Graphic Design USA American Inhouse Design Award'
		);
		expect(content.lab).toEqual([]);
	});

	it('references assets that exist under static', () => {
		const content = getPortfolioContent();
		const paths = [
			content.site.metadata.seo.image,
			content.site.metadata.resumeUrl,
			...content.projects.map((item) => item.metadata.featuredImage)
		].filter((path): path is string => Boolean(path));

		expect(paths.length).toBeGreaterThan(0);
		for (const path of paths) {
			expect(existsSync(resolve('static', path.slice(1))), path).toBe(true);
		}
	});
});

function validSources() {
	return {
		site: frontmatter({
			hero: {
				firstName: 'Hugo',
				lastName: 'Hsi',
				tagline: 'Tagline',
				ctaPrimary: { text: 'Work', link: '#projects' }
			},
			contact: { email: 'hello@example.com' },
			footer: { heading: 'Hello', intro: 'Intro', builtWith: 'Built with SvelteKit' },
			seo: {
				title: 'Portfolio',
				description: 'Portfolio description',
				canonicalUrl: 'https://example.com',
				image: '/media/site/social-preview.jpg',
				imageAlt: 'Portfolio preview',
				keywords: ['Svelte'],
				themeColor: '#F8F6F1',
				jobTitle: 'Developer'
			}
		}),
		technologies: frontmatter({
			frontend: ['Svelte', 'React'],
			backend: ['TypeScript'],
			database: ['PostgreSQL'],
			tools: ['Git']
		}),
		projects: {},
		experience: {},
		education: {},
		lab: {}
	};
}

function project(overrides: Record<string, unknown> = {}) {
	return frontmatter({
		title: 'Project',
		excerpt: 'Project excerpt',
		context: 'work',
		company: 'Company',
		order: 1,
		technologies: [],
		...overrides
	});
}

function experience(overrides: Record<string, unknown> = {}) {
	return frontmatter({
		company: 'Company',
		role: 'Developer',
		startDate: '2020-01-01',
		...overrides
	});
}

function frontmatter(metadata: unknown, body = '') {
	return `---
${JSON.stringify(metadata)}
---
${body}`;
}
