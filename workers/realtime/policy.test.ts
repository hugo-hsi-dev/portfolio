import { describe, expect, it } from 'vitest';

import { MAX_MESSAGES_PER_SECOND } from './constants';
import {
	identityForVisitor,
	isAllowedOrigin,
	recordMessage,
	tokensMatch,
	type ConnectionAttachment
} from './policy';
import { VISITOR_A } from './test-helpers';

function attachment(): ConnectionAttachment {
	return {
		...identityForVisitor(VISITOR_A, 'adf73f2f-f2d3-4246-9087-84a46bf665bd'),
		cursor: null,
		selectedFrameId: null,
		lastSeq: -1,
		rateWindowStartedAt: 1_000,
		rateWindowCount: 0,
		rateLimited: false
	};
}

describe('realtime policies', () => {
	it('creates a stable public identity without exposing the visitor id', () => {
		const first = identityForVisitor(VISITOR_A, 'adf73f2f-f2d3-4246-9087-84a46bf665bd');
		const second = identityForVisitor(VISITOR_A, 'd71ac75c-08cc-427d-bdc8-eaca7f7a70f7');
		expect(first.name).toBe(second.name);
		expect(first.color).toBe(second.color);
		expect(first.name).not.toContain(VISITOR_A);
	});

	it('normalizes configured origins and rejects non-http origins', () => {
		expect(
			isAllowedOrigin(
				new Request('https://realtime.test', { headers: { Origin: 'https://hugohsi.dev' } }),
				'https://www.hugohsi.dev, https://hugohsi.dev'
			)
		).toBe(true);
		expect(
			isAllowedOrigin(
				new Request('https://realtime.test', { headers: { Origin: 'file:///tmp/index.html' } }),
				'file://'
			)
		).toBe(false);
	});

	it('records a fixed rate window and resets it after one second', () => {
		const atLimit = recordMessage(
			{ ...attachment(), rateWindowCount: MAX_MESSAGES_PER_SECOND - 1 },
			1_500
		);
		expect(atLimit.exceeded).toBe(false);
		expect(atLimit.attachment.rateWindowCount).toBe(MAX_MESSAGES_PER_SECOND);

		const exceeded = recordMessage(atLimit.attachment, 1_501);
		expect(exceeded.exceeded).toBe(true);
		expect(exceeded.attachment.rateLimited).toBe(true);

		const reset = recordMessage(
			{ ...attachment(), rateWindowCount: MAX_MESSAGES_PER_SECOND },
			2_000
		);
		expect(reset.exceeded).toBe(false);
		expect(reset.attachment.rateWindowCount).toBe(1);
	});

	it('compares reset tokens by their fixed-length digests', async () => {
		expect(await tokensMatch('same-token', 'same-token')).toBe(true);
		expect(await tokensMatch('wrong', 'expected-token')).toBe(false);
	});
});
