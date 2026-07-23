import type { Handle, HandleServerError } from '@sveltejs/kit';

import { createRequestErrorLog, createRequestLog } from '$lib/server/observability';

export const handle: Handle = async ({ event, resolve }) => {
	const startedAt = performance.now();
	const response = await resolve(event);
	console.info(
		JSON.stringify(
			createRequestLog({
				method: event.request.method,
				routeId: event.route.id,
				status: response.status,
				durationMs: performance.now() - startedAt
			})
		)
	);
	return response;
};

export const handleError: HandleServerError = ({ event, status, message }) => {
	console.error(
		JSON.stringify(createRequestErrorLog(event.request.method, event.route.id, status))
	);
	return { message };
};
