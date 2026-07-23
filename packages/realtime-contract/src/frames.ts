export const WORLD_COORDINATE_LIMIT = 1_000_000;
export const MAX_CLIENT_MESSAGE_BYTES = 2_048;

export const FRAME_IDS = [
	'profile',
	'contact',
	'project-national-medal-of-honor-museum',
	'project-1st-avenue-advisors',
	'project-minecentral',
	'project-me-save-money',
	'experience-praxis-loop',
	'experience-lookout',
	'education-columbia-university',
	'education-the-new-school',
	'technologies'
] as const;

export type FrameId = (typeof FRAME_IDS)[number];

export interface FramePosition {
	id: FrameId;
	x: number;
	y: number;
}

export const INITIAL_FRAME_POSITIONS = [
	{ id: 'profile', x: 0, y: 0 },
	{ id: 'contact', x: 0, y: 580 },
	{ id: 'project-national-medal-of-honor-museum', x: 900, y: 0 },
	{ id: 'project-1st-avenue-advisors', x: 1740, y: 0 },
	{ id: 'project-minecentral', x: 900, y: 760 },
	{ id: 'project-me-save-money', x: 1740, y: 760 },
	{ id: 'experience-praxis-loop', x: 0, y: 1100 },
	{ id: 'experience-lookout', x: 0, y: 1840 },
	{ id: 'education-columbia-university', x: 900, y: 1540 },
	{ id: 'education-the-new-school', x: 1640, y: 1540 },
	{ id: 'technologies', x: 900, y: 2020 }
] as const satisfies readonly FramePosition[];

// Kept as a stable public name for existing clients and persisted reset behavior.
export const DEFAULT_FRAME_POSITIONS: readonly FramePosition[] = INITIAL_FRAME_POSITIONS;

const frameIdSet: ReadonlySet<string> = new Set(FRAME_IDS);
const initialPositionById = new Map(
	INITIAL_FRAME_POSITIONS.map((position) => [position.id, position])
);

export function isFrameId(value: unknown): value is FrameId {
	return typeof value === 'string' && frameIdSet.has(value);
}

export function getInitialFramePosition(id: FrameId): FramePosition {
	const position = initialPositionById.get(id);
	if (!position) throw new Error(`Missing initial position for frame: ${id}`);
	return position;
}
