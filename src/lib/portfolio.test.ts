import { describe, expect, it } from 'vitest';

import { contact, projects } from './portfolio.js';

describe('portfolio content', () => {
	it('keeps project stories complete and uniquely addressable', () => {
		expect(projects).toHaveLength(3);
		expect(new Set(projects.map((project) => project.slug)).size).toBe(projects.length);

		for (const project of projects) {
			expect(project.image).toMatch(/^\/media\/projects\//);
			expect(project.imageAlt.length).toBeGreaterThan(20);
			expect(project.liveUrl).toMatch(/^https:\/\//);
			expect(project.stages.map((stage) => stage.id)).toEqual(['found', 'built', 'changed']);
		}
	});

	it('exposes hiring contact paths', () => {
		expect(contact.email).toMatch(/@/);
		expect(contact.resume).toMatch(/\.pdf$/);
		expect(contact.github).toMatch(/^https:\/\//);
		expect(contact.linkedin).toMatch(/^https:\/\//);
	});
});
