export function shouldSendThrottled(
	now: number,
	lastSentAt: number,
	intervalMs: number,
	force = false
): boolean {
	return force || now - lastSentAt >= intervalMs;
}
