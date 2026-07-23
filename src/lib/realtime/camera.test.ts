import { describe, expect, it } from 'vitest';

import { FRAME_DEFINITIONS } from './layout';
import {
	MAX_ZOOM,
	MIN_ZOOM,
	boundsForFrames,
	cameraForBounds,
	screenToWorld,
	worldToScreen,
	zoomCameraAt
} from './camera';

describe('camera transforms', () => {
	it('round-trips points between world and screen space', () => {
		const camera = { x: 240, y: -80, zoom: 1.75 };
		const world = { x: 410, y: 220 };
		expect(screenToWorld(worldToScreen(world, camera), camera)).toEqual(world);
	});

	it('keeps the world point under the cursor fixed while zooming', () => {
		const camera = { x: 100, y: 50, zoom: 1 };
		const cursor = { x: 300, y: 250 };
		const before = screenToWorld(cursor, camera);
		const zoomed = zoomCameraAt(camera, cursor, 2);
		expect(screenToWorld(cursor, zoomed)).toEqual(before);
	});

	it('clamps fit calculations to supported zoom bounds', () => {
		expect(
			cameraForBounds({ x: 0, y: 0, width: 1, height: 1 }, { width: 1000, height: 800 }).zoom
		).toBe(MAX_ZOOM);
		expect(
			cameraForBounds({ x: 0, y: 0, width: 1, height: 1 }, { width: 1000, height: 800 }, 64, 2).zoom
		).toBe(2);
		expect(
			cameraForBounds(
				{ x: 0, y: 0, width: 1_000_000, height: 1_000_000 },
				{ width: 320, height: 480 }
			).zoom
		).toBe(MIN_ZOOM);
	});

	it('calculates bounds using each frame dimension', () => {
		const bounds = boundsForFrames([FRAME_DEFINITIONS[0], FRAME_DEFINITIONS[1]], 20);
		expect(bounds).toEqual({ x: -20, y: -20, width: 760, height: 980 });
	});
});
