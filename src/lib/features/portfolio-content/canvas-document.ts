import type { FrameId } from '@portfolio/realtime-contract';

import { FRAME_DEFINITIONS, type FrameDefinition, type FrameKind } from './frame-definitions';
import type { PortfolioContent } from './loader';

type ProjectDocument = PortfolioContent['projects'][number];
type ExperienceDocument = PortfolioContent['experience'][number];
type EducationDocument = PortfolioContent['education'][number];

interface CanvasFrameBase {
	id: FrameId;
	kind: FrameKind;
	title: string;
	x: number;
	y: number;
	width: number;
	height: number;
	order: number;
}

export interface ProfileCanvasFrame extends CanvasFrameBase {
	kind: 'profile';
	site: PortfolioContent['site'];
}

export interface ContactCanvasFrame extends CanvasFrameBase {
	kind: 'contact';
	site: PortfolioContent['site'];
}

export interface ProjectCanvasFrame extends CanvasFrameBase {
	kind: 'project';
	project: ProjectDocument;
	projectIndex: number;
}

export interface ExperienceCanvasFrame extends CanvasFrameBase {
	kind: 'experience';
	experience: ExperienceDocument;
}

export interface EducationCanvasFrame extends CanvasFrameBase {
	kind: 'education';
	education: EducationDocument;
}

export interface TechnologiesCanvasFrame extends CanvasFrameBase {
	kind: 'technologies';
	technologies: PortfolioContent['technologies'];
}

export type CanvasFrame =
	| ProfileCanvasFrame
	| ContactCanvasFrame
	| ProjectCanvasFrame
	| ExperienceCanvasFrame
	| EducationCanvasFrame
	| TechnologiesCanvasFrame;

export interface CanvasDocument {
	frames: CanvasFrame[];
}

type ReferencedKind = 'project' | 'experience' | 'education';

function indexBySlug<T extends { slug: string }>(
	documents: T[],
	kind: ReferencedKind
): Map<string, T> {
	const indexed = new Map<string, T>();
	for (const document of documents) {
		if (indexed.has(document.slug)) {
			throw new Error(`Duplicate ${kind} content slug: ${document.slug}`);
		}
		indexed.set(document.slug, document);
	}
	return indexed;
}

function referencedContentSlug(frame: FrameDefinition): string {
	if (!('contentSlug' in frame)) {
		throw new Error(`Frame ${frame.id} does not declare a content slug.`);
	}
	return frame.contentSlug;
}

function assertEveryDocumentIsReferenced(
	documents: { slug: string }[],
	usedSlugs: Set<string>,
	kind: ReferencedKind
): void {
	const orphaned = documents.filter((document) => !usedSlugs.has(document.slug));
	if (orphaned.length > 0) {
		throw new Error(
			`Unreferenced ${kind} content: ${orphaned.map((document) => document.slug).join(', ')}`
		);
	}
}

export function buildCanvasDocument(
	content: PortfolioContent,
	definitions: readonly FrameDefinition[] = FRAME_DEFINITIONS
): CanvasDocument {
	const projects = indexBySlug(content.projects, 'project');
	const experience = indexBySlug(content.experience, 'experience');
	const education = indexBySlug(content.education, 'education');
	const usedProjects = new Set<string>();
	const usedExperience = new Set<string>();
	const usedEducation = new Set<string>();
	const ids = new Set<FrameId>();

	const frames = definitions.map((definition): CanvasFrame => {
		if (ids.has(definition.id)) {
			throw new Error(`Duplicate canvas frame id: ${definition.id}`);
		}
		ids.add(definition.id);
		const base = {
			id: definition.id,
			kind: definition.kind,
			title: definition.title,
			x: definition.x,
			y: definition.y,
			width: definition.width,
			height: definition.height,
			order: definition.order
		};

		switch (definition.kind) {
			case 'profile':
				return {
					...base,
					kind: 'profile',
					title: `${content.site.metadata.hero.firstName} ${content.site.metadata.hero.lastName}`,
					site: content.site
				};
			case 'contact':
				return { ...base, kind: 'contact', site: content.site };
			case 'technologies':
				return { ...base, kind: 'technologies', technologies: content.technologies };
			case 'project': {
				const slug = referencedContentSlug(definition);
				if (usedProjects.has(slug)) throw new Error(`Project content is referenced twice: ${slug}`);
				const project = projects.get(slug);
				if (!project)
					throw new Error(`Missing project content for frame ${definition.id}: ${slug}`);
				usedProjects.add(slug);
				return {
					...base,
					kind: 'project',
					title: project.metadata.title,
					project,
					projectIndex: content.projects.findIndex((candidate) => candidate.slug === slug)
				};
			}
			case 'experience': {
				const slug = referencedContentSlug(definition);
				if (usedExperience.has(slug))
					throw new Error(`Experience content is referenced twice: ${slug}`);
				const item = experience.get(slug);
				if (!item)
					throw new Error(`Missing experience content for frame ${definition.id}: ${slug}`);
				usedExperience.add(slug);
				return {
					...base,
					kind: 'experience',
					title: item.metadata.company,
					experience: item
				};
			}
			case 'education': {
				const slug = referencedContentSlug(definition);
				if (usedEducation.has(slug))
					throw new Error(`Education content is referenced twice: ${slug}`);
				const item = education.get(slug);
				if (!item) throw new Error(`Missing education content for frame ${definition.id}: ${slug}`);
				usedEducation.add(slug);
				return {
					...base,
					kind: 'education',
					title: item.metadata.institution,
					education: item
				};
			}
		}
	});

	assertEveryDocumentIsReferenced(content.projects, usedProjects, 'project');
	assertEveryDocumentIsReferenced(content.experience, usedExperience, 'experience');
	assertEveryDocumentIsReferenced(content.education, usedEducation, 'education');

	return { frames };
}
