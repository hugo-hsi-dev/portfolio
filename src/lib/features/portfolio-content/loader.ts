import {
	educationContentSchema,
	experienceContentSchema,
	projectContentSchema,
	siteContentSchema,
	technologiesContentSchema,
	type EducationContent,
	type ExperienceContent,
	type ProjectContent,
	type SiteContent,
	type TechnologiesContent
} from './schemas';
import { parseContentDocument, slugFromPath, type ContentDocument } from './parser';

export interface PortfolioSources {
	site: string;
	technologies: string;
	projects: Record<string, string>;
	experience: Record<string, string>;
	education: Record<string, string>;
}

export interface PortfolioContent {
	site: ContentDocument<SiteContent>;
	projects: ContentDocument<ProjectContent>[];
	experience: ContentDocument<ExperienceContent>[];
	education: ContentDocument<EducationContent>[];
	technologies: ContentDocument<TechnologiesContent>;
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

export function buildPortfolioContent(sources: PortfolioSources): PortfolioContent {
	const projects = parseMany(sources.projects, projectContentSchema).sort(
		(a, b) => a.metadata.order - b.metadata.order
	);
	const duplicateOrder = projects.find(
		(project, index) => index > 0 && project.metadata.order === projects[index - 1].metadata.order
	);

	if (duplicateOrder) {
		throw new Error(
			`Invalid content in /src/content/projects/${duplicateOrder.slug}.md at order: must be unique; ${duplicateOrder.metadata.order} is used more than once`
		);
	}

	return {
		site: parseContentDocument('site', sources.site, '/src/content/site.md', siteContentSchema),
		technologies: parseContentDocument(
			'technologies',
			sources.technologies,
			'/src/content/technologies.md',
			technologiesContentSchema
		),
		projects,
		experience: parseMany(sources.experience, experienceContentSchema).sort(
			(a, b) => Date.parse(b.metadata.startDate) - Date.parse(a.metadata.startDate)
		),
		education: parseMany(sources.education, educationContentSchema).sort(
			(a, b) => Date.parse(b.metadata.completionDate) - Date.parse(a.metadata.completionDate)
		)
	};
}

export function getPortfolioContent(): PortfolioContent {
	return buildPortfolioContent({
		site: onlyModule(siteModules, 'site.md'),
		technologies: onlyModule(technologyModules, 'technologies.md'),
		projects: projectModules,
		experience: experienceModules,
		education: educationModules
	});
}

function parseMany<TSchema extends Parameters<typeof parseContentDocument>[3]>(
	modules: Record<string, string>,
	schema: TSchema
) {
	return Object.entries(modules).map(([path, source]) =>
		parseContentDocument(slugFromPath(path), source, path, schema)
	);
}

function onlyModule(modules: Record<string, string>, name: string) {
	const source = Object.values(modules)[0];
	if (!source) throw new Error(`Missing content file ${name}`);
	return source;
}
