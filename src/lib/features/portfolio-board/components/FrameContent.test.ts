// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
	buildCanvasDocument,
	getPortfolioContent,
	type CanvasFrame
} from '$lib/features/portfolio-content';

import FrameContent from './FrameContent.svelte';

function frame(kind: CanvasFrame['kind']): CanvasFrame {
	const found = buildCanvasDocument(getPortfolioContent()).frames.find(
		(candidate) => candidate.kind === kind
	);
	if (!found) throw new Error(`Missing ${kind} frame`);
	return found;
}

afterEach(cleanup);

describe('FrameContent', () => {
	it('renders resolved experience highlights without raw HTML', () => {
		render(FrameContent, { frame: frame('experience'), onOpenProjects: vi.fn() });

		expect(screen.getByText('Experience')).toBeInTheDocument();
		expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0);
	});

	it('exposes the profile project action', async () => {
		const onOpenProjects = vi.fn();
		const user = userEvent.setup();
		render(FrameContent, { frame: frame('profile'), onOpenProjects });

		await user.click(screen.getByRole('button'));
		expect(onOpenProjects).toHaveBeenCalledOnce();
	});

	it('renders named contact links', () => {
		render(FrameContent, { frame: frame('contact'), onOpenProjects: vi.fn() });

		expect(screen.getByRole('link', { name: /email me/i })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /github/i })).toBeInTheDocument();
	});

	it('renders a resolved project with its technology tags', () => {
		const projectFrame = frame('project');
		render(FrameContent, { frame: projectFrame, onOpenProjects: vi.fn() });

		expect(
			screen.getByRole('heading', {
				name: projectFrame.kind === 'project' ? projectFrame.project.metadata.title : ''
			})
		).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /visit project/i })).toBeInTheDocument();
	});

	it('renders resolved education content', () => {
		const educationFrame = frame('education');
		render(FrameContent, { frame: educationFrame, onOpenProjects: vi.fn() });

		expect(
			screen.getByRole('heading', {
				name:
					educationFrame.kind === 'education' ? educationFrame.education.metadata.institution : ''
			})
		).toBeInTheDocument();
	});

	it('renders all technology categories', () => {
		render(FrameContent, { frame: frame('technologies'), onOpenProjects: vi.fn() });

		for (const category of ['Frontend', 'Backend', 'Database', 'Tools']) {
			expect(screen.getByRole('heading', { name: category })).toBeInTheDocument();
		}
	});
});
