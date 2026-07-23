import { describe, expect, it } from 'vitest';

import { buildCanvasDocument } from './canvas-document';
import { FRAME_DEFINITIONS, type FrameDefinition } from './frame-definitions';
import { getPortfolioContent } from './loader';

describe('buildCanvasDocument', () => {
	it('resolves every configured frame to typed content', () => {
		const document = buildCanvasDocument(getPortfolioContent());
		const project = document.frames.find((frame) => frame.kind === 'project');

		expect(document.frames).toHaveLength(FRAME_DEFINITIONS.length);
		expect(project?.kind === 'project' ? project.project.metadata.title : null).toBeTruthy();
	});

	it('fails for missing content references', () => {
		const content = getPortfolioContent();
		expect(() =>
			buildCanvasDocument({ ...content, projects: content.projects.slice(1) }, FRAME_DEFINITIONS)
		).toThrow(/Missing project content/);
	});

	it('fails for orphaned and duplicate references', () => {
		const content = getPortfolioContent();
		expect(() =>
			buildCanvasDocument(
				{ ...content, projects: [...content.projects, { ...content.projects[0], slug: 'orphan' }] },
				FRAME_DEFINITIONS
			)
		).toThrow(/Unreferenced project content: orphan/);

		const projectFrames = FRAME_DEFINITIONS.filter((frame) => frame.kind === 'project');
		const duplicateDefinitions = [
			...FRAME_DEFINITIONS.filter((frame) => frame.id !== projectFrames[1].id),
			{ ...projectFrames[1], contentSlug: projectFrames[0].contentSlug }
		];
		expect(() =>
			buildCanvasDocument(content, duplicateDefinitions as unknown as readonly FrameDefinition[])
		).toThrow(/Project content is referenced twice/);
	});
});
