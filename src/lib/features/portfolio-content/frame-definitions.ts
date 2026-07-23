import {
	DEFAULT_FRAME_POSITIONS,
	FRAME_IDS,
	WORLD_COORDINATE_LIMIT,
	getInitialFramePosition,
	isFrameId,
	type FrameId,
	type FramePosition
} from '@portfolio/realtime-contract';

export const FRAME_DEFINITIONS = [
	withInitialPosition({
		id: 'profile',
		kind: 'profile',
		title: 'Hugo Hsi',
		width: 720,
		height: 460,
		order: 0
	}),
	withInitialPosition({
		id: 'contact',
		kind: 'contact',
		title: 'Contact',
		width: 520,
		height: 360,
		order: 1
	}),
	withInitialPosition({
		id: 'project-national-medal-of-honor-museum',
		kind: 'project',
		contentSlug: 'national-medal-of-honor-museum',
		title: 'National Medal of Honor Museum',
		width: 720,
		height: 620,
		order: 2
	}),
	withInitialPosition({
		id: 'project-1st-avenue-advisors',
		kind: 'project',
		contentSlug: '1st-avenue-advisors',
		title: '1st Avenue Advisors',
		width: 720,
		height: 620,
		order: 3
	}),
	withInitialPosition({
		id: 'project-minecentral',
		kind: 'project',
		contentSlug: 'minecentral',
		title: 'MineCentral',
		width: 720,
		height: 620,
		order: 4
	}),
	withInitialPosition({
		id: 'project-me-save-money',
		kind: 'project',
		contentSlug: 'me-save-money',
		title: 'Me Save Money',
		width: 720,
		height: 620,
		order: 5
	}),
	withInitialPosition({
		id: 'experience-praxis-loop',
		kind: 'experience',
		contentSlug: 'praxis-loop',
		title: 'Praxis Loop',
		width: 720,
		height: 620,
		order: 6
	}),
	withInitialPosition({
		id: 'experience-lookout',
		kind: 'experience',
		contentSlug: 'lookout',
		title: 'Lookout',
		width: 720,
		height: 560,
		order: 7
	}),
	withInitialPosition({
		id: 'education-columbia-university',
		kind: 'education',
		contentSlug: 'columbia-university',
		title: 'Columbia University',
		width: 620,
		height: 360,
		order: 8
	}),
	withInitialPosition({
		id: 'education-the-new-school',
		kind: 'education',
		contentSlug: 'the-new-school',
		title: 'The New School',
		width: 620,
		height: 360,
		order: 9
	}),
	withInitialPosition({
		id: 'technologies',
		kind: 'technologies',
		title: 'Technologies',
		width: 1360,
		height: 500,
		order: 10
	})
] as const;

export type FrameDefinition = (typeof FRAME_DEFINITIONS)[number];
export type FrameKind = FrameDefinition['kind'];

function withInitialPosition<const Definition extends { id: FrameId }>(
	definition: Definition
): Definition & Pick<FramePosition, 'x' | 'y'> {
	const { x, y } = getInitialFramePosition(definition.id);
	return { ...definition, x, y };
}

export function getFrameDefinition(id: FrameId): FrameDefinition {
	const frame = FRAME_DEFINITIONS.find((candidate) => candidate.id === id);
	if (!frame) {
		throw new Error(`Unknown frame id: ${id}`);
	}
	return frame;
}

export {
	DEFAULT_FRAME_POSITIONS,
	FRAME_IDS,
	WORLD_COORDINATE_LIMIT,
	getInitialFramePosition,
	isFrameId
};
export type { FrameId, FramePosition };
