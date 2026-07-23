import { visitorIdSchema } from '@portfolio/realtime-contract';

export const VISITOR_ID_STORAGE_KEY = 'portfolio-visitor-id';

export interface VisitorStorage {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
}

export function getOrCreateVisitorId(storage: VisitorStorage, createId: () => string): string {
	try {
		const storedVisitorId = visitorIdSchema.safeParse(storage.getItem(VISITOR_ID_STORAGE_KEY));
		if (storedVisitorId.success) return storedVisitorId.data;
		const visitorId = visitorIdSchema.parse(createId());
		storage.setItem(VISITOR_ID_STORAGE_KEY, visitorId);
		return visitorId;
	} catch {
		return visitorIdSchema.parse(createId());
	}
}
