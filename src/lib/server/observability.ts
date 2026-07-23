export interface RequestLogInput {
	method: string;
	routeId: string | null;
	status: number;
	durationMs: number;
}

export function createRequestLog({ method, routeId, status, durationMs }: RequestLogInput) {
	return {
		event: 'request.completed',
		method,
		route: routeId ?? 'unmatched',
		status,
		durationMs: Math.max(0, Math.round(durationMs))
	};
}

export function createRequestErrorLog(method: string, routeId: string | null, status: number) {
	return {
		event: 'request.failed',
		method,
		route: routeId ?? 'unmatched',
		status
	};
}
