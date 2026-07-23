export {
	buildPortfolioContent,
	getPortfolioContent,
	type PortfolioContent,
	type PortfolioSources
} from './loader';
export {
	buildCanvasDocument,
	type CanvasDocument,
	type CanvasFrame,
	type ContactCanvasFrame,
	type EducationCanvasFrame,
	type ExperienceCanvasFrame,
	type ProfileCanvasFrame,
	type ProjectCanvasFrame,
	type TechnologiesCanvasFrame
} from './canvas-document';
export {
	FRAME_DEFINITIONS,
	getFrameDefinition,
	type FrameDefinition,
	type FrameKind
} from './frame-definitions';
export { formatPortfolioDate } from './date';
export { buildStructuredDataJson, socialImageUrl } from './seo';
export { parseFrontmatterDocument, type ContentDocument } from './parser';
export {
	educationContentSchema,
	experienceContentSchema,
	projectContentSchema,
	siteContentSchema,
	technologiesContentSchema,
	type DatePrecision,
	type EducationContent,
	type ExperienceContent,
	type ProjectContent,
	type ProjectContext,
	type SiteContent,
	type TechnologiesContent,
	type TechnologyCategory
} from './schemas';
