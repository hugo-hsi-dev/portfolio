export function nextClientSequence(current: number): number {
	if (!Number.isSafeInteger(current) || current < 0 || current >= Number.MAX_SAFE_INTEGER) {
		throw new RangeError('Client sequence is outside the supported range.');
	}
	return current + 1;
}
