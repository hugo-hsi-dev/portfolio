import { describe, expect, it } from 'vitest';

import { applyPeerServerMessage, disconnectPeers, EMPTY_PEER_MODEL } from './peers';

describe('peer transitions', () => {
	it('adds, updates, and removes a peer without mutating the previous model', () => {
		const peer = {
			sessionId: 'adf73f2f-f2d3-4246-9087-84a46bf665bd',
			visitorId: '2ac3308f-a622-4b9b-9782-981d19ef943c',
			name: 'Guest 1234',
			color: '#0acf83',
			cursor: null,
			selectedFrameId: null
		};
		const joined = applyPeerServerMessage(EMPTY_PEER_MODEL, { type: 'peer.join', peer });
		const updated = applyPeerServerMessage(joined, {
			type: 'peer.update',
			sessionId: peer.sessionId,
			cursor: { x: 1, y: 2 },
			selectedFrameId: 'profile'
		});
		const left = applyPeerServerMessage(updated, {
			type: 'peer.leave',
			sessionId: peer.sessionId
		});

		expect(EMPTY_PEER_MODEL.peers).toEqual([]);
		expect(updated.peers[0]).toMatchObject({ cursor: { x: 1, y: 2 } });
		expect(left.peers).toEqual([]);
	});

	it('clears remote peers on disconnect but retains self identity', () => {
		const model = {
			self: {
				sessionId: 'adf73f2f-f2d3-4246-9087-84a46bf665bd',
				visitorId: '2ac3308f-a622-4b9b-9782-981d19ef943c',
				name: 'Guest',
				color: '#0acf83'
			},
			peers: [
				{
					sessionId: '4b87ff41-92a6-4c72-93cc-ad92b663487c',
					visitorId: 'e2536a65-41c0-4ba9-8bd5-4e1a3bd09108',
					name: 'Guest 2',
					color: '#ff7262',
					cursor: null,
					selectedFrameId: null
				}
			]
		};
		expect(disconnectPeers(model)).toEqual({ ...model, peers: [] });
	});
});
