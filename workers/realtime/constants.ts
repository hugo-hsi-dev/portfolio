export const MAX_CONNECTIONS = 64;
// A drag can emit one frame update and one cursor update at 20 Hz, plus start/end bursts.
export const MAX_MESSAGES_PER_SECOND = 60;
export const RATE_LIMIT_CLOSE_CODE = 1008;
export const ROOM_NAME = 'public';
export const RESET_HEADER = 'x-board-reset-token';

export const CURSOR_COLORS = [
	'#f24822',
	'#a259ff',
	'#1abcfe',
	'#0acf83',
	'#ff7262',
	'#8b5cf6',
	'#ea4c89',
	'#14b8a6'
] as const;
