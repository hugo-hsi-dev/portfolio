export function log(
	level: 'info' | 'warn' | 'error',
	message: string,
	data: Record<string, unknown> = {}
): void {
	const entry = JSON.stringify({ level, message, timestamp: new Date().toISOString(), ...data });
	if (level === 'error') console.error(entry);
	else if (level === 'warn') console.warn(entry);
	else console.log(entry);
}
