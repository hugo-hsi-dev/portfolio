import { handleBoardWebSocket } from '$lib/server/board-websocket';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ request, platform, url }) =>
	handleBoardWebSocket({
		request,
		url,
		rooms: platform?.env.PORTFOLIO_ROOMS
	});
