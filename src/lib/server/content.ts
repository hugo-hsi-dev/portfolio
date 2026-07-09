import { marked } from 'marked';

export type ProjectContext = 'personal' | 'work';
export type TechnologyCategory = 'frontend' | 'backend' | 'database' | 'tools';

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

export interface TimelineContent {
	company?: string;
	role?: string;
	institution?: string;
	degree?: string;
	startDate: string;
	endDate?: string;
	isCurrent?: boolean;
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
	experience: MarkdownDocument<TimelineContent>[];
	education: MarkdownDocument<TimelineContent>[];
	lab: MarkdownDocument<LabContent>[];
	technologies: MarkdownDocument<TechnologiesContent>;
}

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
		throw new Error(`Invalid JSON frontmatter in ${sourcePath}: ${(error as Error).message}`);
	}

	const body = match[2].trim();

	return {
		metadata,
		body,
		html: marked.parse(body, { async: false })
	};
}

export function buildPortfolioContent(sources: PortfolioSources): PortfolioContent {
	return {
		site: parseOne<SiteContent>('site', sources.site),
		technologies: parseOne<TechnologiesContent>('technologies', sources.technologies),
		projects: parseMany<ProjectContent>(sources.projects).sort(
			(a, b) => a.metadata.order - b.metadata.order
		),
		experience: parseMany<TimelineContent>(sources.experience).sort(
			(a, b) => Date.parse(b.metadata.startDate) - Date.parse(a.metadata.startDate)
		),
		education: parseMany<TimelineContent>(sources.education).sort(
			(a, b) => Date.parse(b.metadata.startDate) - Date.parse(a.metadata.startDate)
		),
		lab: parseMany<LabContent>(sources.lab).sort((a, b) =>
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

function parseOne<TMetadata>(slug: string, source: string): MarkdownDocument<TMetadata> {
	return {
		slug,
		...parseMarkdownDocument<TMetadata>(source, `${slug}.md`)
	};
}

function parseMany<TMetadata>(modules: Record<string, string>): MarkdownDocument<TMetadata>[] {
	return Object.entries(modules).map(([path, source]) => ({
		slug: slugFromPath(path),
		...parseMarkdownDocument<TMetadata>(source, path)
	}));
}

function onlyModule(modules: Record<string, string>, name: string) {
	const source = Object.values(modules)[0];

	if (!source) {
		throw new Error(`Missing content file ${name}`);
	}

	return source;
}

function slugFromPath(path: string) {
	return path.split('/').pop()?.replace(/\.md$/, '') ?? path;
}
