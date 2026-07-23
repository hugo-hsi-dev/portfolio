import { dev } from '$app/environment';
import { handleBoardReset } from '$lib/server/board-reset';

import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ request, platform }) =>
	handleBoardReset(request, {
		isDevelopment: dev,
		rooms: platform?.env.PORTFOLIO_ROOMS,
		expectedToken: platform?.env.BOARD_RESET_TOKEN
	});
