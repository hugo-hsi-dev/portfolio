import type { Identity, PeerState, ServerMessage } from '@portfolio/realtime-contract';

export interface PeerModel {
	self: Identity | null;
	peers: PeerState[];
}

export const EMPTY_PEER_MODEL: PeerModel = { self: null, peers: [] };

export function applyPeerServerMessage(model: PeerModel, message: ServerMessage): PeerModel {
	switch (message.type) {
		case 'room.snapshot':
			return { self: message.self, peers: message.peers };
		case 'peer.join':
			return {
				...model,
				peers: [
					...model.peers.filter((peer) => peer.sessionId !== message.peer.sessionId),
					message.peer
				]
			};
		case 'peer.leave':
			return {
				...model,
				peers: model.peers.filter((peer) => peer.sessionId !== message.sessionId)
			};
		case 'peer.update':
			return {
				...model,
				peers: model.peers.map((peer) =>
					peer.sessionId === message.sessionId
						? {
								...peer,
								cursor: message.cursor,
								selectedFrameId: message.selectedFrameId,
								view: message.view
							}
						: peer
				)
			};
		default:
			return model;
	}
}

export function disconnectPeers(model: PeerModel): PeerModel {
	return model.peers.length === 0 ? model : { ...model, peers: [] };
}
