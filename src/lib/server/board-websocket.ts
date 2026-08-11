import { validateWebSocketRequest } from './request-policy';

export interface WebSocketRoom {
	fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

export interface WebSocketRoomNamespace {
	getByName(name: string): WebSocketRoom;
}

export interface WebSocketHandlerContext {
	request: Request;
	url: URL;
	rooms?: WebSocketRoomNamespace;
}

const bindingUnavailable = () =>
	new Response('Realtime binding unavailable; use ws://127.0.0.1:8788/ws in Vite dev.', {
		status: 503
	});

export async function handleBoardWebSocket({
	request,
	url,
	rooms
}: WebSocketHandlerContext): Promise<Response> {
	const rejection = validateWebSocketRequest(request, url.origin);
	if (rejection) return new Response(rejection.message, { status: rejection.status });
	if (!rooms) return bindingUnavailable();

	const internalUrl = new URL('https://portfolio-room/ws');
	const visitorId = url.searchParams.get('visitorId');
	if (visitorId) internalUrl.searchParams.set('visitorId', visitorId);
	const protocol = url.searchParams.get('protocol');
	if (protocol) internalUrl.searchParams.set('protocol', protocol);

	const proxyRequest = new Request(internalUrl, {
		method: 'GET',
		headers: request.headers
	});

	try {
		return await rooms.getByName('public').fetch(proxyRequest);
	} catch {
		return bindingUnavailable();
	}
}
