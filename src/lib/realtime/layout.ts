export const WORLD_COORDINATE_LIMIT = 1_000_000;

export const FRAME_DEFINITIONS = [
	{
		id: 'profile',
		kind: 'profile',
		title: 'Hugo Hsi',
		x: 0,
		y: 0,
		width: 720,
		height: 460,
		order: 0
	},
	{
		id: 'contact',
		kind: 'contact',
		title: 'Contact',
		x: 0,
		y: 580,
		width: 520,
		height: 360,
		order: 1
	},
	{
		id: 'project-national-medal-of-honor-museum',
		kind: 'project',
		contentSlug: 'national-medal-of-honor-museum',
		title: 'National Medal of Honor Museum',
		x: 900,
		y: 0,
		width: 720,
		height: 620,
		order: 2
	},
	{
		id: 'project-1st-avenue-advisors',
		kind: 'project',
		contentSlug: '1st-avenue-advisors',
		title: '1st Avenue Advisors',
		x: 1740,
		y: 0,
		width: 720,
		height: 620,
		order: 3
	},
	{
		id: 'project-minecentral',
		kind: 'project',
		contentSlug: 'minecentral',
		title: 'MineCentral',
		x: 900,
		y: 760,
		width: 720,
		height: 620,
		order: 4
	},
	{
		id: 'project-me-save-money',
		kind: 'project',
		contentSlug: 'me-save-money',
		title: 'Me Save Money',
		x: 1740,
		y: 760,
		width: 720,
		height: 620,
		order: 5
	},
	{
		id: 'experience-praxis-loop',
		kind: 'experience',
		contentSlug: 'praxis-loop',
		title: 'Praxis Loop',
		x: 0,
		y: 1100,
		width: 720,
		height: 620,
		order: 6
	},
	{
		id: 'experience-lookout',
		kind: 'experience',
		contentSlug: 'lookout',
		title: 'Lookout',
		x: 0,
		y: 1840,
		width: 720,
		height: 560,
		order: 7
	},
	{
		id: 'education-columbia-university',
		kind: 'education',
		contentSlug: 'columbia-university',
		title: 'Columbia University',
		x: 900,
		y: 1540,
		width: 620,
		height: 360,
		order: 8
	},
	{
		id: 'education-the-new-school',
		kind: 'education',
		contentSlug: 'the-new-school',
		title: 'The New School',
		x: 1640,
		y: 1540,
		width: 620,
		height: 360,
		order: 9
	},
	{
		id: 'technologies',
		kind: 'technologies',
		title: 'Technologies',
		x: 900,
		y: 2020,
		width: 1360,
		height: 500,
		order: 10
	}
] as const;

export type FrameDefinition = (typeof FRAME_DEFINITIONS)[number];
export type FrameId = FrameDefinition['id'];
export type FrameKind = FrameDefinition['kind'];

export interface FramePosition {
	id: FrameId;
	x: number;
	y: number;
}

export const FRAME_IDS = FRAME_DEFINITIONS.map((frame) => frame.id) as readonly FrameId[];

const frameIdSet: ReadonlySet<string> = new Set(FRAME_IDS);

export const DEFAULT_FRAME_POSITIONS: readonly FramePosition[] = FRAME_DEFINITIONS.map(
	({ id, x, y }) => ({ id, x, y })
);

export function isFrameId(value: unknown): value is FrameId {
	return typeof value === 'string' && frameIdSet.has(value);
}

export function getFrameDefinition(id: FrameId): FrameDefinition {
	const frame = FRAME_DEFINITIONS.find((candidate) => candidate.id === id);
	if (!frame) {
		throw new Error(`Unknown frame id: ${id}`);
	}
	return frame;
}
