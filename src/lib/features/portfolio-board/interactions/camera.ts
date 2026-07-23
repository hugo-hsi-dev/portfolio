import type { FrameId, Point } from '@portfolio/realtime-contract';

import {
	FRAME_DEFINITIONS,
	getFrameDefinition
} from '$lib/features/portfolio-content/frame-definitions';

export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 4;

export interface Camera {
	x: number;
	y: number;
	zoom: number;
}

export interface Bounds {
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface PositionedFrame {
	id: FrameId;
	x: number;
	y: number;
}

export function clampZoom(zoom: number): number {
	return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

export function worldToScreen(point: Point, camera: Camera): Point {
	return {
		x: point.x * camera.zoom + camera.x,
		y: point.y * camera.zoom + camera.y
	};
}

export function screenToWorld(point: Point, camera: Camera): Point {
	return {
		x: (point.x - camera.x) / camera.zoom,
		y: (point.y - camera.y) / camera.zoom
	};
}

export function panCamera(camera: Camera, delta: Point): Camera {
	return { ...camera, x: camera.x + delta.x, y: camera.y + delta.y };
}

export function zoomCameraAt(camera: Camera, screenPoint: Point, nextZoom: number): Camera {
	const worldPoint = screenToWorld(screenPoint, camera);
	const zoom = clampZoom(nextZoom);
	return {
		x: screenPoint.x - worldPoint.x * zoom,
		y: screenPoint.y - worldPoint.y * zoom,
		zoom
	};
}

export function boundsForFrames(frames: readonly PositionedFrame[], padding = 0): Bounds {
	if (frames.length === 0) {
		return { x: -padding, y: -padding, width: padding * 2, height: padding * 2 };
	}

	let minX = Number.POSITIVE_INFINITY;
	let minY = Number.POSITIVE_INFINITY;
	let maxX = Number.NEGATIVE_INFINITY;
	let maxY = Number.NEGATIVE_INFINITY;

	for (const frame of frames) {
		const definition = getFrameDefinition(frame.id);
		minX = Math.min(minX, frame.x);
		minY = Math.min(minY, frame.y);
		maxX = Math.max(maxX, frame.x + definition.width);
		maxY = Math.max(maxY, frame.y + definition.height);
	}

	return {
		x: minX - padding,
		y: minY - padding,
		width: maxX - minX + padding * 2,
		height: maxY - minY + padding * 2
	};
}

export function cameraForBounds(
	bounds: Bounds,
	viewport: { width: number; height: number },
	padding = 64,
	maxZoom = MAX_ZOOM
): Camera {
	const availableWidth = Math.max(1, viewport.width - padding * 2);
	const availableHeight = Math.max(1, viewport.height - padding * 2);
	const zoom = Math.min(
		clampZoom(maxZoom),
		clampZoom(
			Math.min(
				availableWidth / Math.max(1, bounds.width),
				availableHeight / Math.max(1, bounds.height)
			)
		)
	);
	return {
		x: viewport.width / 2 - (bounds.x + bounds.width / 2) * zoom,
		y: viewport.height / 2 - (bounds.y + bounds.height / 2) * zoom,
		zoom
	};
}

export function defaultFrameBounds(padding = 0): Bounds {
	return boundsForFrames(FRAME_DEFINITIONS, padding);
}
