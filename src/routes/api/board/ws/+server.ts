import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request, platform, url }) => {
	if (request.headers.get('upgrade')?.toLowerCase() !== 'websocket') {
		return new Response('Expected WebSocket upgrade', { status: 426 });
	}
	const origin = request.headers.get('origin');
	if (!origin || origin !== url.origin) {
		return new Response('Forbidden', { status: 403 });
	}
	if (!platform?.env.PORTFOLIO_ROOMS) {
		return new Response('Realtime binding unavailable; use ws://127.0.0.1:8788/ws in Vite dev.', {
			status: 503
		});
	}

	const internalUrl = new URL('https://portfolio-room/ws');
	const visitorId = url.searchParams.get('visitorId');
	if (visitorId) internalUrl.searchParams.set('visitorId', visitorId);
	const proxyRequest = new Request(internalUrl, {
		method: 'GET',
		headers: request.headers
	});
	return platform.env.PORTFOLIO_ROOMS.getByName('public').fetch(proxyRequest);
};
