import {
	WORLD_COORDINATE_LIMIT,
	type FrameId,
	type FramePosition,
	type Point
} from '@portfolio/realtime-contract';

import { getFrameDefinition } from '$lib/features/portfolio-content/frame-definitions';

import type { Bounds } from './camera';

export type SelectionAlignment = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';

export type DistributionAxis = 'horizontal' | 'vertical';
export type SnapAnchor = 'start' | 'center' | 'end';

export interface SnapGuide {
	orientation: 'horizontal' | 'vertical';
	position: number;
	start: number;
	end: number;
	targetFrameId: FrameId;
	movingAnchor: SnapAnchor;
	targetAnchor: SnapAnchor;
}

export interface SelectionTranslation {
	delta: Point;
	positions: FramePosition[];
}

export interface SelectionSnap {
	delta: Point;
	guides: SnapGuide[];
}

interface SizedBounds extends Bounds {
	id: FrameId;
}

interface SnapCandidate {
	adjustment: number;
	target: SizedBounds;
	movingAnchor: SnapAnchor;
	targetAnchor: SnapAnchor;
	targetIndex: number;
	movingAnchorIndex: number;
	targetAnchorIndex: number;
}

const SNAP_ANCHORS: readonly SnapAnchor[] = ['start', 'center', 'end'];

/** Creates a positive-size world-space rectangle regardless of drag direction. */
export function normalizeMarqueeRect(start: Point, end: Point): Bounds {
	return {
		x: Math.min(start.x, end.x),
		y: Math.min(start.y, end.y),
		width: Math.abs(end.x - start.x),
		height: Math.abs(end.y - start.y)
	};
}

/** Returns intersecting frame IDs in the same stable order as the input frames. */
export function selectFramesIntersectingMarquee(
	frames: readonly FramePosition[],
	marquee: Bounds
): FrameId[] {
	const marqueeRight = marquee.x + marquee.width;
	const marqueeBottom = marquee.y + marquee.height;

	return frames
		.filter((frame) => {
			const bounds = frameBounds(frame);
			return (
				bounds.x <= marqueeRight &&
				bounds.x + bounds.width >= marquee.x &&
				bounds.y <= marqueeBottom &&
				bounds.y + bounds.height >= marquee.y
			);
		})
		.map((frame) => frame.id);
}

/** Computes the exact union of the supplied frames, or null for an empty selection. */
export function getSelectionBounds(frames: readonly FramePosition[]): Bounds | null {
	if (frames.length === 0) return null;

	let minX = Number.POSITIVE_INFINITY;
	let minY = Number.POSITIVE_INFINITY;
	let maxX = Number.NEGATIVE_INFINITY;
	let maxY = Number.NEGATIVE_INFINITY;

	for (const frame of frames) {
		const bounds = frameBounds(frame);
		minX = Math.min(minX, bounds.x);
		minY = Math.min(minY, bounds.y);
		maxX = Math.max(maxX, bounds.x + bounds.width);
		maxY = Math.max(maxY, bounds.y + bounds.height);
	}

	return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/**
 * Applies one shared delta to a selection. If any top-left coordinate would leave
 * the realtime world's valid range, the delta is reduced for the whole group.
 */
export function translateSelection(
	initialPositions: readonly FramePosition[],
	requestedDelta: Point,
	coordinateLimit = WORLD_COORDINATE_LIMIT
): SelectionTranslation {
	if (initialPositions.length === 0) {
		return { delta: { x: 0, y: 0 }, positions: [] };
	}

	const xs = initialPositions.map((frame) => frame.x);
	const ys = initialPositions.map((frame) => frame.y);
	const delta = {
		x: clamp(
			requestedDelta.x,
			-coordinateLimit - Math.min(...xs),
			coordinateLimit - Math.max(...xs)
		),
		y: clamp(
			requestedDelta.y,
			-coordinateLimit - Math.min(...ys),
			coordinateLimit - Math.max(...ys)
		)
	};

	return {
		delta,
		positions: initialPositions.map((frame) => ({
			...frame,
			x: frame.x + delta.x,
			y: frame.y + delta.y
		}))
	};
}

/**
 * Snaps the moving selection's outer edges or centers to unselected frame edges
 * and centers. At most one best match is returned on each axis.
 */
export function snapSelection(
	movingFrames: readonly FramePosition[],
	requestedDelta: Point,
	targetFrames: readonly FramePosition[],
	threshold = 8
): SelectionSnap {
	const movingBounds = getSelectionBounds(movingFrames);
	if (!movingBounds || targetFrames.length === 0) {
		return { delta: { ...requestedDelta }, guides: [] };
	}

	const movingIds = new Set(movingFrames.map((frame) => frame.id));
	const targets = targetFrames.filter((frame) => !movingIds.has(frame.id)).map(frameBounds);
	if (targets.length === 0) return { delta: { ...requestedDelta }, guides: [] };
	const snapThreshold = Math.max(0, threshold);
	const verticalMatch = bestSnapCandidate(
		axisAnchors(movingBounds, 'horizontal', requestedDelta.x),
		targets,
		'horizontal',
		snapThreshold
	);
	const horizontalMatch = bestSnapCandidate(
		axisAnchors(movingBounds, 'vertical', requestedDelta.y),
		targets,
		'vertical',
		snapThreshold
	);
	const delta = {
		x: requestedDelta.x + (verticalMatch?.adjustment ?? 0),
		y: requestedDelta.y + (horizontalMatch?.adjustment ?? 0)
	};
	const translatedBounds = offsetBounds(movingBounds, delta);
	const guides: SnapGuide[] = [];

	if (verticalMatch) {
		guides.push({
			orientation: 'vertical',
			position: anchorValue(verticalMatch.target, 'horizontal', verticalMatch.targetAnchor),
			start: Math.min(translatedBounds.y, verticalMatch.target.y),
			end: Math.max(
				translatedBounds.y + translatedBounds.height,
				verticalMatch.target.y + verticalMatch.target.height
			),
			targetFrameId: verticalMatch.target.id,
			movingAnchor: verticalMatch.movingAnchor,
			targetAnchor: verticalMatch.targetAnchor
		});
	}

	if (horizontalMatch) {
		guides.push({
			orientation: 'horizontal',
			position: anchorValue(horizontalMatch.target, 'vertical', horizontalMatch.targetAnchor),
			start: Math.min(translatedBounds.x, horizontalMatch.target.x),
			end: Math.max(
				translatedBounds.x + translatedBounds.width,
				horizontalMatch.target.x + horizontalMatch.target.width
			),
			targetFrameId: horizontalMatch.target.id,
			movingAnchor: horizontalMatch.movingAnchor,
			targetAnchor: horizontalMatch.targetAnchor
		});
	}

	return { delta, guides };
}

/** Aligns every frame to one edge or center of the selection's union bounds. */
export function alignSelection(
	frames: readonly FramePosition[],
	alignment: SelectionAlignment
): FramePosition[] {
	const bounds = getSelectionBounds(frames);
	if (!bounds) return [];

	return frames.map((frame) => {
		const definition = getFrameDefinition(frame.id);
		switch (alignment) {
			case 'left':
				return { ...frame, x: bounds.x };
			case 'center':
				return { ...frame, x: bounds.x + (bounds.width - definition.width) / 2 };
			case 'right':
				return { ...frame, x: bounds.x + bounds.width - definition.width };
			case 'top':
				return { ...frame, y: bounds.y };
			case 'middle':
				return { ...frame, y: bounds.y + (bounds.height - definition.height) / 2 };
			case 'bottom':
				return { ...frame, y: bounds.y + bounds.height - definition.height };
		}
	});
}

/**
 * Spaces three or more frames evenly while retaining the selection's outer
 * bounds and the original order along the distribution axis.
 */
export function distributeSelection(
	frames: readonly FramePosition[],
	axis: DistributionAxis
): FramePosition[] {
	if (frames.length < 3) return frames.map((frame) => ({ ...frame }));

	const horizontal = axis === 'horizontal';
	const sorted = frames
		.map((frame, inputIndex) => ({ frame, inputIndex }))
		.sort((left, right) => {
			const difference = horizontal ? left.frame.x - right.frame.x : left.frame.y - right.frame.y;
			return difference || left.inputIndex - right.inputIndex;
		});
	const selectionBounds = getSelectionBounds(frames)!;
	const start = horizontal ? selectionBounds.x : selectionBounds.y;
	const extent = horizontal ? selectionBounds.width : selectionBounds.height;
	const totalSize = sorted.reduce((total, { frame }) => {
		const definition = getFrameDefinition(frame.id);
		return total + (horizontal ? definition.width : definition.height);
	}, 0);
	const gap = (extent - totalSize) / (frames.length - 1);
	const distributed = new Map<number, FramePosition>();
	let cursor = start;

	for (const { frame, inputIndex } of sorted) {
		const definition = getFrameDefinition(frame.id);
		distributed.set(inputIndex, horizontal ? { ...frame, x: cursor } : { ...frame, y: cursor });
		cursor += (horizontal ? definition.width : definition.height) + gap;
	}

	return frames.map((_, index) => distributed.get(index)!);
}

function frameBounds(frame: FramePosition): SizedBounds {
	const definition = getFrameDefinition(frame.id);
	return {
		id: frame.id,
		x: frame.x,
		y: frame.y,
		width: definition.width,
		height: definition.height
	};
}

function offsetBounds(bounds: Bounds, delta: Point): Bounds {
	return { ...bounds, x: bounds.x + delta.x, y: bounds.y + delta.y };
}

function axisAnchors(bounds: Bounds, axis: DistributionAxis, delta: number): readonly number[] {
	const start = axis === 'horizontal' ? bounds.x : bounds.y;
	const size = axis === 'horizontal' ? bounds.width : bounds.height;
	return [start + delta, start + size / 2 + delta, start + size + delta];
}

function anchorValue(bounds: Bounds, axis: DistributionAxis, anchor: SnapAnchor): number {
	const start = axis === 'horizontal' ? bounds.x : bounds.y;
	const size = axis === 'horizontal' ? bounds.width : bounds.height;
	if (anchor === 'start') return start;
	if (anchor === 'center') return start + size / 2;
	return start + size;
}

function bestSnapCandidate(
	movingAnchors: readonly number[],
	targets: readonly SizedBounds[],
	axis: DistributionAxis,
	threshold: number
): SnapCandidate | null {
	let best: SnapCandidate | null = null;

	for (let targetIndex = 0; targetIndex < targets.length; targetIndex += 1) {
		const target = targets[targetIndex];
		for (
			let movingAnchorIndex = 0;
			movingAnchorIndex < SNAP_ANCHORS.length;
			movingAnchorIndex += 1
		) {
			for (
				let targetAnchorIndex = 0;
				targetAnchorIndex < SNAP_ANCHORS.length;
				targetAnchorIndex += 1
			) {
				const movingAnchor = SNAP_ANCHORS[movingAnchorIndex];
				const targetAnchor = SNAP_ANCHORS[targetAnchorIndex];
				const adjustment =
					anchorValue(target, axis, targetAnchor) - movingAnchors[movingAnchorIndex];
				if (Math.abs(adjustment) > threshold) continue;

				const candidate: SnapCandidate = {
					adjustment,
					target,
					movingAnchor,
					targetAnchor,
					targetIndex,
					movingAnchorIndex,
					targetAnchorIndex
				};
				if (!best || compareSnapCandidates(candidate, best) < 0) best = candidate;
			}
		}
	}

	return best;
}

function compareSnapCandidates(left: SnapCandidate, right: SnapCandidate): number {
	return (
		Math.abs(left.adjustment) - Math.abs(right.adjustment) ||
		Number(left.movingAnchor !== left.targetAnchor) -
			Number(right.movingAnchor !== right.targetAnchor) ||
		left.targetIndex - right.targetIndex ||
		left.movingAnchorIndex - right.movingAnchorIndex ||
		left.targetAnchorIndex - right.targetAnchorIndex
	);
}

function clamp(value: number, minimum: number, maximum: number): number {
	return Math.max(minimum, Math.min(maximum, value));
}
