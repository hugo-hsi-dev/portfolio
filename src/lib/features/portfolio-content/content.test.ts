import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
	buildPortfolioContent,
	getPortfolioContent,
	parseFrontmatterDocument,
	type PortfolioSources
} from './index';

describe('parseFrontmatterDocument', () => {
	it('parses JSON frontmatter without exposing an untyped body', () => {
		expect.assertions(1);
		const document = parseFrontmatterDocument<{ title: string }>(frontmatter({ title: 'Hello' }));
		expect(document).toEqual({ metadata: { title: 'Hello' } });
	});

	it('rejects missing fences, invalid JSON, and Markdown bodies', () => {
		expect.assertions(3);
		expect(() => parseFrontmatterDocument('# No frontmatter')).toThrow('Missing JSON frontmatter');
		expect(() => parseFrontmatterDocument('---\n{title:"Hello"}\n---')).toThrow(
			'Invalid JSON frontmatter'
		);
		expect(() => parseFrontmatterDocument(frontmatter({ title: 'Hello' }, '# Untyped'))).toThrow(
			'Unexpected Markdown body'
		);
	});
});

describe('buildPortfolioContent', () => {
	it('sorts projects, experience, and education deterministically', () => {
		expect.assertions(3);
		const sources = validSources();
		sources.projects = {
			'/src/content/projects/b.md': project({ title: 'B', order: 2 }),
			'/src/content/projects/a.md': project({ title: 'A', order: 1, context: 'personal' })
		};
		sources.experience = {
			'/src/content/experience/old.md': experience({
				company: 'Old',
				startDate: '2020-01-01'
			}),
			'/src/content/experience/new.md': experience({
				company: 'New',
				startDate: '2023-01-01'
			})
		};
		sources.education = {
			'/src/content/education/old.md': education({
				institution: 'Old',
				completionDate: '2019-01-01'
			}),
			'/src/content/education/new.md': education({
				institution: 'New',
				completionDate: '2024-01-01'
			})
		};

		const content = buildPortfolioContent(sources);

		expect(content.projects.map((item) => item.slug)).toEqual(['a', 'b']);
		expect(content.experience.map((item) => item.metadata.company)).toEqual(['New', 'Old']);
		expect(content.education.map((item) => item.metadata.institution)).toEqual(['New', 'Old']);
	});

	it('rejects unknown fields at every strict schema boundary', () => {
		expect.assertions(2);
		const projectSources = validSources();
		projectSources.projects = {
			'/src/content/projects/broken.md': project({ unsupported: true })
		};
		const siteSources = validSources();
		siteSources.site = frontmatter({
			...validSite(),
			hero: { ...validSite().hero, unsupported: true }
		});

		expect(() => buildPortfolioContent(projectSources)).toThrow('Unrecognized key: "unsupported"');
		expect(() => buildPortfolioContent(siteSources)).toThrow('Unrecognized key: "unsupported"');
	});

	it('validates calendar dates and current/completed date relationships', () => {
		expect.assertions(6);
		const invalidDate = withExperience({ startDate: '2024-02-30' });
		const invalidRange = withExperience({
			startDate: '2024-02-01',
			endDate: '2024-01-01'
		});
		const currentWithEnd = withExperience({
			isCurrent: true,
			endDate: '2024-03-01'
		});
		const currentWithPrecision = withExperience({
			isCurrent: true,
			endDatePrecision: 'month'
		});
		const precisionWithoutEnd = withExperience({
			isCurrent: false,
			endDatePrecision: 'year'
		});
		const completedWithoutEnd = withExperience({ isCurrent: false });

		expect(() => buildPortfolioContent(invalidDate)).toThrow(
			'startDate: must be a valid YYYY-MM-DD date'
		);
		expect(() => buildPortfolioContent(invalidRange)).toThrow(
			'endDate: must not be before startDate'
		);
		expect(() => buildPortfolioContent(currentWithEnd)).toThrow(
			'endDate: must be omitted when isCurrent is true'
		);
		expect(() => buildPortfolioContent(currentWithPrecision)).toThrow(
			'endDatePrecision: must be omitted when isCurrent is true'
		);
		expect(() => buildPortfolioContent(precisionWithoutEnd)).toThrow(
			'endDatePrecision: requires endDate'
		);
		expect(() => buildPortfolioContent(completedWithoutEnd)).toThrow(
			'endDate: is required when isCurrent is false or omitted'
		);
	});

	it('requires typed, unique experience highlights', () => {
		expect.assertions(2);
		const missingHighlights = validSources();
		missingHighlights.experience = {
			'/src/content/experience/missing.md': frontmatter({
				company: 'Company',
				role: 'Developer',
				startDate: '2020-01-01'
			})
		};
		const duplicateHighlights = withExperience({ highlights: ['Same', 'Same'] });

		expect(() => buildPortfolioContent(missingHighlights)).toThrow('highlights');
		expect(() => buildPortfolioContent(duplicateHighlights)).toThrow(
			'highlights: must not contain duplicates'
		);
	});

	it('requires valid web URLs', () => {
		expect.assertions(3);
		const badProjectUrl = validSources();
		badProjectUrl.projects = {
			'/src/content/projects/broken.md': project({ liveUrl: 'javascript:alert(1)' })
		};
		const badContactUrl = validSources();
		badContactUrl.site = frontmatter({
			...validSite(),
			contact: { ...validSite().contact, github: '/relative' }
		});
		const badCanonicalUrl = validSources();
		badCanonicalUrl.site = frontmatter({
			...validSite(),
			seo: { ...validSite().seo, canonicalUrl: 'ftp://example.com' }
		});

		expect(() => buildPortfolioContent(badProjectUrl)).toThrow(
			'liveUrl: must be an http or https URL'
		);
		expect(() => buildPortfolioContent(badContactUrl)).toThrow(
			'contact.github: must be an http or https URL'
		);
		expect(() => buildPortfolioContent(badCanonicalUrl)).toThrow(
			'seo.canonicalUrl: must be an http or https URL'
		);
	});

	it('validates media paths and requires image/alt pairs', () => {
		expect.assertions(4);
		const traversal = validSources();
		traversal.projects = {
			'/src/content/projects/broken.md': project({
				featuredImage: '/media/../secret.jpg',
				featuredImageAlt: 'Secret'
			})
		};
		const badExtension = validSources();
		badExtension.site = frontmatter({
			...validSite(),
			resumeUrl: '/media/resume/resume.txt'
		});
		const missingAlt = validSources();
		missingAlt.projects = {
			'/src/content/projects/broken.md': project({
				featuredImage: '/media/projects/example.jpg'
			})
		};
		const missingImage = validSources();
		missingImage.projects = {
			'/src/content/projects/broken.md': project({ featuredImageAlt: 'Example' })
		};

		expect(() => buildPortfolioContent(traversal)).toThrow(
			'featuredImage: must be an absolute /media/ path without traversal'
		);
		expect(() => buildPortfolioContent(badExtension)).toThrow('resumeUrl: must end with .pdf');
		expect(() => buildPortfolioContent(missingAlt)).toThrow(
			'featuredImageAlt: is required when featuredImage is set'
		);
		expect(() => buildPortfolioContent(missingImage)).toThrow(
			'featuredImageAlt: requires featuredImage'
		);
	});

	it('requires a company for work projects and unique project ordering', () => {
		expect.assertions(2);
		const missingCompany = validSources();
		missingCompany.projects = {
			'/src/content/projects/client.md': project({ company: null })
		};
		const duplicateOrder = validSources();
		duplicateOrder.projects = {
			'/src/content/projects/a.md': project({ title: 'A', order: 1 }),
			'/src/content/projects/b.md': project({ title: 'B', order: 1 })
		};

		expect(() => buildPortfolioContent(missingCompany)).toThrow(
			'company: is required when context is "work"'
		);
		expect(() => buildPortfolioContent(duplicateOrder)).toThrow('order: must be unique');
	});
});

describe('getPortfolioContent', () => {
	it('loads the checked-in content with typed experience highlights', () => {
		expect.assertions(7);
		const content = getPortfolioContent();

		expect(content.site.metadata.hero.firstName).toBe('Hugo');
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
		expect(content.experience[0].metadata.highlights).toHaveLength(4);
		expect(content.experience[1].metadata.highlights.at(-1)).toContain(
			'Graphic Design USA American Inhouse Design Award'
		);
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

function validSources(): PortfolioSources {
	return {
		site: frontmatter(validSite()),
		technologies: frontmatter({
			frontend: ['Svelte', 'React'],
			backend: ['TypeScript'],
			database: ['PostgreSQL'],
			tools: ['Git']
		}),
		projects: {},
		experience: {},
		education: {}
	};
}

function validSite() {
	return {
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
		isCurrent: true,
		highlights: ['Built a reliable product.'],
		...overrides
	});
}

function education(overrides: Record<string, unknown> = {}) {
	return frontmatter({
		institution: 'School',
		degree: 'Degree',
		completionDate: '2020-01-01',
		...overrides
	});
}

function withExperience(overrides: Record<string, unknown>) {
	const sources = validSources();
	sources.experience = {
		'/src/content/experience/role.md': experience(overrides)
	};
	return sources;
}

function frontmatter(metadata: unknown, body = '') {
	return `---
${JSON.stringify(metadata)}
---
${body}`;
}
