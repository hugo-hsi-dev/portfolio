import { ROOM_NAME } from './constants';
import { log } from './logger';

export const realtimeHandler = {
	async fetch(request, env): Promise<Response> {
		const url = new URL(request.url);
		try {
			if (url.pathname === '/health') {
				return Response.json({ ok: true });
			}
			if (url.pathname !== '/ws' && url.pathname !== '/reset') {
				return new Response('Not found', { status: 404 });
			}
			const room = env.PORTFOLIO_ROOMS.getByName(ROOM_NAME);
			return await room.fetch(request);
		} catch (error) {
			log('error', 'request failed', {
				path: url.pathname,
				error: error instanceof Error ? error.message : String(error)
			});
			return Response.json({ error: 'Realtime service unavailable' }, { status: 503 });
		}
	}
} satisfies ExportedHandler<RealtimeEnv>;
