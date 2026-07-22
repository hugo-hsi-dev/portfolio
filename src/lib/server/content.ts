import { marked } from 'marked';

export type ProjectContext = 'personal' | 'work';
export type TechnologyCategory = 'frontend' | 'backend' | 'database' | 'tools';
export type DatePrecision = 'month' | 'year';

export interface MarkdownDocument<TMetadata> {
	slug: string;
	metadata: TMetadata;
	body: string;
	html: string;
}

export interface SiteContent {
	hero: {
		firstName: string;
		lastName: string;
		tagline: string;
		intro?: string;
		ctaPrimary: {
			text: string;
			link: string;
		};
		ctaSecondary?: {
			text: string;
		};
		quote?: string;
	};
	contact: {
		email: string;
		github?: string;
		linkedin?: string;
	};
	footer: {
		heading: string;
		intro: string;
		builtWith: string;
	};
	seo: {
		title: string;
		description: string;
		canonicalUrl: string;
		image: string;
		imageAlt: string;
		keywords: string[];
		themeColor: string;
		jobTitle: string;
	};
	resumeUrl?: string;
}

export interface ProjectContent {
	title: string;
	excerpt: string;
	context: ProjectContext;
	company?: string;
	order: number;
	liveUrl?: string;
	featuredImage?: string;
	featuredImageAlt?: string;
	technologies: string[];
}

export interface ExperienceContent {
	company: string;
	role: string;
	startDate: string;
	startDatePrecision?: DatePrecision;
	endDate?: string;
	endDatePrecision?: DatePrecision;
	isCurrent?: boolean;
}

export interface EducationContent {
	institution: string;
	degree: string;
	completionDate: string;
	datePrecision?: DatePrecision;
}

export interface LabContent {
	name: string;
	description: string;
	technologies: string;
	githubUrl?: string;
}

export type TechnologiesContent = Record<TechnologyCategory, string[]>;

interface PortfolioSources {
	site: string;
	technologies: string;
	projects: Record<string, string>;
	experience: Record<string, string>;
	education: Record<string, string>;
	lab: Record<string, string>;
}

export interface PortfolioContent {
	site: MarkdownDocument<SiteContent>;
	projects: MarkdownDocument<ProjectContent>[];
	experience: MarkdownDocument<ExperienceContent>[];
	education: MarkdownDocument<EducationContent>[];
	lab: MarkdownDocument<LabContent>[];
	technologies: MarkdownDocument<TechnologiesContent>;
}

type Validator<T> = (value: unknown, sourcePath: string) => T;

const siteModules = import.meta.glob<string>('/src/content/site.md', {
	eager: true,
	import: 'default',
	query: '?raw'
});
const technologyModules = import.meta.glob<string>('/src/content/technologies.md', {
	eager: true,
	import: 'default',
	query: '?raw'
});
const projectModules = import.meta.glob<string>('/src/content/projects/*.md', {
	eager: true,
	import: 'default',
	query: '?raw'
});
const experienceModules = import.meta.glob<string>('/src/content/experience/*.md', {
	eager: true,
	import: 'default',
	query: '?raw'
});
const educationModules = import.meta.glob<string>('/src/content/education/*.md', {
	eager: true,
	import: 'default',
	query: '?raw'
});
const labModules = import.meta.glob<string>('/src/content/lab/*.md', {
	eager: true,
	import: 'default',
	query: '?raw'
});

export function parseMarkdownDocument<TMetadata>(
	source: string,
	sourcePath = 'markdown.md'
): Omit<MarkdownDocument<TMetadata>, 'slug'> {
	const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);

	if (!match) {
		throw new Error(`Missing JSON frontmatter in ${sourcePath}`);
	}

	let metadata: TMetadata;
	try {
		metadata = JSON.parse(match[1]) as TMetadata;
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		throw new Error(`Invalid JSON frontmatter in ${sourcePath}: ${message}`, { cause: error });
	}

	const body = match[2].trim();

	return {
		metadata,
		body,
		html: marked.parse(body, { async: false })
	};
}

export function buildPortfolioContent(sources: PortfolioSources): PortfolioContent {
	const projects = parseMany(sources.projects, validateProject).sort(
		(a, b) => a.metadata.order - b.metadata.order
	);
	const duplicateOrder = projects.find(
		(project, index) => index > 0 && project.metadata.order === projects[index - 1].metadata.order
	);

	if (duplicateOrder) {
		contentError(
			`/src/content/projects/${duplicateOrder.slug}.md`,
			'order',
			`must be unique; ${duplicateOrder.metadata.order} is used more than once`
		);
	}

	return {
		site: parseOne('site', sources.site, validateSite),
		technologies: parseOne('technologies', sources.technologies, validateTechnologies),
		projects,
		experience: parseMany(sources.experience, validateExperience).sort(byNewestStartDate),
		education: parseMany(sources.education, validateEducation).sort(
			(a, b) => Date.parse(b.metadata.completionDate) - Date.parse(a.metadata.completionDate)
		),
		lab: parseMany(sources.lab, validateLab).sort((a, b) =>
			a.metadata.name.localeCompare(b.metadata.name)
		)
	};
}

export function getPortfolioContent() {
	return buildPortfolioContent({
		site: onlyModule(siteModules, 'site.md'),
		technologies: onlyModule(technologyModules, 'technologies.md'),
		projects: projectModules,
		experience: experienceModules,
		education: educationModules,
		lab: labModules
	});
}

function validateSite(value: unknown, sourcePath: string): SiteContent {
	const site = object(value, sourcePath, 'frontmatter');
	const hero = object(site.hero, sourcePath, 'hero');
	const primary = object(hero.ctaPrimary, sourcePath, 'hero.ctaPrimary');
	const secondary = optionalObject(hero.ctaSecondary, sourcePath, 'hero.ctaSecondary');
	const contact = object(site.contact, sourcePath, 'contact');
	const footer = object(site.footer, sourcePath, 'footer');
	const seo = object(site.seo, sourcePath, 'seo');

	return {
		hero: {
			firstName: string(hero.firstName, sourcePath, 'hero.firstName'),
			lastName: string(hero.lastName, sourcePath, 'hero.lastName'),
			tagline: string(hero.tagline, sourcePath, 'hero.tagline'),
			intro: optionalString(hero.intro, sourcePath, 'hero.intro'),
			ctaPrimary: {
				text: string(primary.text, sourcePath, 'hero.ctaPrimary.text'),
				link: link(primary.link, sourcePath, 'hero.ctaPrimary.link')
			},
			ctaSecondary: secondary
				? { text: string(secondary.text, sourcePath, 'hero.ctaSecondary.text') }
				: undefined,
			quote: optionalString(hero.quote, sourcePath, 'hero.quote')
		},
		contact: {
			email: email(contact.email, sourcePath, 'contact.email'),
			github: optionalWebUrl(contact.github, sourcePath, 'contact.github'),
			linkedin: optionalWebUrl(contact.linkedin, sourcePath, 'contact.linkedin')
		},
		footer: {
			heading: string(footer.heading, sourcePath, 'footer.heading'),
			intro: string(footer.intro, sourcePath, 'footer.intro'),
			builtWith: string(footer.builtWith, sourcePath, 'footer.builtWith')
		},
		seo: {
			title: string(seo.title, sourcePath, 'seo.title'),
			description: string(seo.description, sourcePath, 'seo.description'),
			canonicalUrl: webUrl(seo.canonicalUrl, sourcePath, 'seo.canonicalUrl'),
			image: mediaPath(seo.image, sourcePath, 'seo.image', ['.jpg', '.jpeg', '.png']),
			imageAlt: string(seo.imageAlt, sourcePath, 'seo.imageAlt'),
			keywords: stringArray(seo.keywords, sourcePath, 'seo.keywords'),
			themeColor: hexColor(seo.themeColor, sourcePath, 'seo.themeColor'),
			jobTitle: string(seo.jobTitle, sourcePath, 'seo.jobTitle')
		},
		resumeUrl: optionalMediaPath(site.resumeUrl, sourcePath, 'resumeUrl', ['.pdf'])
	};
}

function validateProject(value: unknown, sourcePath: string): ProjectContent {
	const project = object(value, sourcePath, 'frontmatter');
	const context = enumValue(project.context, ['personal', 'work'] as const, sourcePath, 'context');
	const company = optionalString(project.company, sourcePath, 'company');
	const featuredImage = optionalMediaPath(project.featuredImage, sourcePath, 'featuredImage', [
		'.jpg',
		'.jpeg',
		'.png',
		'.webp',
		'.avif'
	]);
	const featuredImageAlt = optionalString(project.featuredImageAlt, sourcePath, 'featuredImageAlt');

	if (context === 'work' && !company) {
		contentError(sourcePath, 'company', 'is required when context is "work"');
	}

	if (featuredImage && !featuredImageAlt) {
		contentError(sourcePath, 'featuredImageAlt', 'is required when featuredImage is set');
	}

	if (!featuredImage && featuredImageAlt) {
		contentError(sourcePath, 'featuredImageAlt', 'requires featuredImage');
	}

	return {
		title: string(project.title, sourcePath, 'title'),
		excerpt: string(project.excerpt, sourcePath, 'excerpt'),
		context,
		company,
		order: integer(project.order, sourcePath, 'order'),
		liveUrl: optionalWebUrl(project.liveUrl, sourcePath, 'liveUrl'),
		featuredImage,
		featuredImageAlt,
		technologies: stringArray(project.technologies, sourcePath, 'technologies')
	};
}

function validateExperience(value: unknown, sourcePath: string): ExperienceContent {
	const experience = object(value, sourcePath, 'frontmatter');
	const startDate = date(experience.startDate, sourcePath, 'startDate');
	const startDatePrecision = optionalDatePrecision(
		experience.startDatePrecision,
		sourcePath,
		'startDatePrecision'
	);
	const endDate = optionalDate(experience.endDate, sourcePath, 'endDate');
	const endDatePrecision = optionalDatePrecision(
		experience.endDatePrecision,
		sourcePath,
		'endDatePrecision'
	);
	const isCurrent = optionalBoolean(experience.isCurrent, sourcePath, 'isCurrent');

	validateDateRange(startDate, endDate, sourcePath);
	if (isCurrent && endDate) {
		contentError(sourcePath, 'endDate', 'must be omitted when isCurrent is true');
	}

	return {
		company: string(experience.company, sourcePath, 'company'),
		role: string(experience.role, sourcePath, 'role'),
		startDate,
		startDatePrecision,
		endDate,
		endDatePrecision,
		isCurrent
	};
}

function validateEducation(value: unknown, sourcePath: string): EducationContent {
	const education = object(value, sourcePath, 'frontmatter');

	return {
		institution: string(education.institution, sourcePath, 'institution'),
		degree: string(education.degree, sourcePath, 'degree'),
		completionDate: date(education.completionDate, sourcePath, 'completionDate'),
		datePrecision: optionalDatePrecision(education.datePrecision, sourcePath, 'datePrecision')
	};
}

function validateLab(value: unknown, sourcePath: string): LabContent {
	const lab = object(value, sourcePath, 'frontmatter');

	return {
		name: string(lab.name, sourcePath, 'name'),
		description: string(lab.description, sourcePath, 'description'),
		technologies: string(lab.technologies, sourcePath, 'technologies'),
		githubUrl: optionalWebUrl(lab.githubUrl, sourcePath, 'githubUrl')
	};
}

function validateTechnologies(value: unknown, sourcePath: string): TechnologiesContent {
	const technologies = object(value, sourcePath, 'frontmatter');

	return {
		frontend: stringArray(technologies.frontend, sourcePath, 'frontend'),
		backend: stringArray(technologies.backend, sourcePath, 'backend'),
		database: stringArray(technologies.database, sourcePath, 'database'),
		tools: stringArray(technologies.tools, sourcePath, 'tools')
	};
}

function parseOne<TMetadata>(
	slug: string,
	source: string,
	validate: Validator<TMetadata>
): MarkdownDocument<TMetadata> {
	const sourcePath = `/src/content/${slug}.md`;
	const document = parseMarkdownDocument<unknown>(source, sourcePath);

	return {
		...document,
		slug,
		metadata: validate(document.metadata, sourcePath)
	};
}

function parseMany<TMetadata>(
	modules: Record<string, string>,
	validate: Validator<TMetadata>
): MarkdownDocument<TMetadata>[] {
	return Object.entries(modules).map(([path, source]) => {
		const document = parseMarkdownDocument<unknown>(source, path);

		return {
			...document,
			slug: slugFromPath(path),
			metadata: validate(document.metadata, path)
		};
	});
}

function onlyModule(modules: Record<string, string>, name: string) {
	const source = Object.values(modules)[0];

	if (!source) {
		throw new Error(`Missing content file ${name}`);
	}

	return source;
}

function byNewestStartDate<T extends { metadata: { startDate: string } }>(a: T, b: T) {
	return Date.parse(b.metadata.startDate) - Date.parse(a.metadata.startDate);
}

function object(value: unknown, sourcePath: string, field: string): Record<string, unknown> {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		contentError(sourcePath, field, 'must be an object');
	}

	return value as Record<string, unknown>;
}

function optionalObject(value: unknown, sourcePath: string, field: string) {
	return value === undefined || value === null ? undefined : object(value, sourcePath, field);
}

function string(value: unknown, sourcePath: string, field: string) {
	if (typeof value !== 'string' || value.trim() === '') {
		contentError(sourcePath, field, 'must be a non-empty string');
	}

	return value.trim();
}

function optionalString(value: unknown, sourcePath: string, field: string) {
	return value === undefined || value === null ? undefined : string(value, sourcePath, field);
}

function stringArray(value: unknown, sourcePath: string, field: string) {
	if (!Array.isArray(value)) {
		contentError(sourcePath, field, 'must be an array of strings');
	}

	const values = value.map((item, index) => string(item, sourcePath, `${field}[${index}]`));
	if (new Set(values).size !== values.length) {
		contentError(sourcePath, field, 'must not contain duplicates');
	}

	return values;
}

function integer(value: unknown, sourcePath: string, field: string) {
	if (!Number.isInteger(value) || (value as number) < 0) {
		contentError(sourcePath, field, 'must be a non-negative integer');
	}

	return value as number;
}

function optionalBoolean(value: unknown, sourcePath: string, field: string) {
	if (value === undefined || value === null) return undefined;
	if (typeof value !== 'boolean') contentError(sourcePath, field, 'must be a boolean');
	return value;
}

function enumValue<const T extends readonly string[]>(
	value: unknown,
	values: T,
	sourcePath: string,
	field: string
): T[number] {
	if (typeof value !== 'string' || !values.includes(value)) {
		contentError(sourcePath, field, `must be one of: ${values.join(', ')}`);
	}

	return value as T[number];
}

function link(value: unknown, sourcePath: string, field: string) {
	const href = string(value, sourcePath, field);
	if (href.startsWith('/') || href.startsWith('#')) return href;
	return webUrl(href, sourcePath, field);
}

function email(value: unknown, sourcePath: string, field: string) {
	const address = string(value, sourcePath, field);
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
		contentError(sourcePath, field, 'must be a valid email address');
	}

	return address;
}

function webUrl(value: unknown, sourcePath: string, field: string) {
	const url = string(value, sourcePath, field);

	try {
		const parsed = new URL(url);
		if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error();
	} catch {
		contentError(sourcePath, field, 'must be an http or https URL');
	}

	return url;
}

function optionalWebUrl(value: unknown, sourcePath: string, field: string) {
	return value === undefined || value === null ? undefined : webUrl(value, sourcePath, field);
}

function mediaPath(value: unknown, sourcePath: string, field: string, extensions: string[]) {
	const path = string(value, sourcePath, field);
	const lowercasePath = path.toLowerCase();

	if (!path.startsWith('/media/') || path.includes('..')) {
		contentError(sourcePath, field, 'must be an absolute /media/ path without traversal');
	}

	if (!extensions.some((extension) => lowercasePath.endsWith(extension))) {
		contentError(sourcePath, field, `must end with ${extensions.join(', ')}`);
	}

	return path;
}

function optionalMediaPath(
	value: unknown,
	sourcePath: string,
	field: string,
	extensions: string[]
) {
	return value === undefined || value === null
		? undefined
		: mediaPath(value, sourcePath, field, extensions);
}

function date(value: unknown, sourcePath: string, field: string) {
	const dateString = string(value, sourcePath, field);
	const parsed = new Date(`${dateString}T00:00:00.000Z`);

	if (
		!/^\d{4}-\d{2}-\d{2}$/.test(dateString) ||
		Number.isNaN(parsed.getTime()) ||
		parsed.toISOString().slice(0, 10) !== dateString
	) {
		contentError(sourcePath, field, 'must be a valid YYYY-MM-DD date');
	}

	return dateString;
}

function optionalDate(value: unknown, sourcePath: string, field: string) {
	return value === undefined || value === null ? undefined : date(value, sourcePath, field);
}

function optionalDatePrecision(value: unknown, sourcePath: string, field: string) {
	return value === undefined || value === null
		? undefined
		: enumValue(value, ['month', 'year'] as const, sourcePath, field);
}

function validateDateRange(startDate: string, endDate: string | undefined, sourcePath: string) {
	if (endDate && endDate < startDate) {
		contentError(sourcePath, 'endDate', 'must not be before startDate');
	}
}

function hexColor(value: unknown, sourcePath: string, field: string) {
	const color = string(value, sourcePath, field);
	if (!/^#[\da-f]{6}$/i.test(color)) {
		contentError(sourcePath, field, 'must be a six-digit hex color');
	}

	return color;
}

function slugFromPath(path: string) {
	return path.split('/').pop()?.replace(/\.md$/, '') ?? path;
}

function contentError(sourcePath: string, field: string, message: string): never {
	throw new Error(`Invalid content in ${sourcePath} at ${field}: ${message}`);
}
