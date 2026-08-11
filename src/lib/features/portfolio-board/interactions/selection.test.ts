import { WORLD_COORDINATE_LIMIT, type FramePosition } from '@portfolio/realtime-contract';
import { describe, expect, it } from 'vitest';

import {
	alignSelection,
	distributeSelection,
	getSelectionBounds,
	normalizeMarqueeRect,
	selectFramesIntersectingMarquee,
	snapSelection,
	translateSelection,
	type SelectionAlignment
} from './selection';

const frames = (...items: FramePosition[]) => items;

describe('selection geometry', () => {
	describe('marquee selection', () => {
		it('normalizes a world-space marquee dragged in any direction', () => {
			expect(normalizeMarqueeRect({ x: 10, y: 50 }, { x: -5, y: 20 })).toEqual({
				x: -5,
				y: 20,
				width: 15,
				height: 30
			});
			expect(normalizeMarqueeRect({ x: -5, y: 20 }, { x: 10, y: 50 })).toEqual({
				x: -5,
				y: 20,
				width: 15,
				height: 30
			});
		});

		it('returns intersecting frames in canvas order, including edge contact', () => {
			const positioned = frames(
				{ id: 'profile', x: 0, y: 0 },
				{ id: 'contact', x: 800, y: 0 },
				{ id: 'education-columbia-university', x: 2_000, y: 2_000 }
			);

			expect(
				selectFramesIntersectingMarquee(positioned, {
					x: 720,
					y: 100,
					width: 100,
					height: 100
				})
			).toEqual(['profile', 'contact']);
			expect(
				selectFramesIntersectingMarquee(positioned, {
					x: 1_500,
					y: 1_500,
					width: 100,
					height: 100
				})
			).toEqual([]);
		});

		it('supports a zero-size marquee point inside a frame', () => {
			expect(
				selectFramesIntersectingMarquee(frames({ id: 'profile', x: 10, y: 20 }), {
					x: 100,
					y: 100,
					width: 0,
					height: 0
				})
			).toEqual(['profile']);
		});
	});

	describe('selection bounds and translation', () => {
		it('computes the exact union across frames with different dimensions', () => {
			expect(
				getSelectionBounds(
					frames({ id: 'profile', x: 100, y: 200 }, { id: 'contact', x: 900, y: 100 })
				)
			).toEqual({ x: 100, y: 100, width: 1_320, height: 560 });
			expect(getSelectionBounds([])).toBeNull();
		});

		it('translates every frame by one immutable shared delta', () => {
			const initial = frames({ id: 'profile', x: 10, y: 20 }, { id: 'contact', x: 100, y: 200 });
			const result = translateSelection(initial, { x: 25, y: -40 });

			expect(result).toEqual({
				delta: { x: 25, y: -40 },
				positions: [
					{ id: 'profile', x: 35, y: -20 },
					{ id: 'contact', x: 125, y: 160 }
				]
			});
			expect(initial).toEqual([
				{ id: 'profile', x: 10, y: 20 },
				{ id: 'contact', x: 100, y: 200 }
			]);
			expect(result.positions[0]).not.toBe(initial[0]);
		});

		it('clamps the whole group at both world-coordinate boundaries', () => {
			const result = translateSelection(
				frames(
					{ id: 'profile', x: WORLD_COORDINATE_LIMIT - 1, y: -WORLD_COORDINATE_LIMIT + 4 },
					{ id: 'contact', x: WORLD_COORDINATE_LIMIT - 10, y: 0 }
				),
				{ x: 100, y: -100 }
			);

			expect(result.delta).toEqual({ x: 1, y: -4 });
			expect(result.positions).toEqual([
				{ id: 'profile', x: WORLD_COORDINATE_LIMIT, y: -WORLD_COORDINATE_LIMIT },
				{ id: 'contact', x: WORLD_COORDINATE_LIMIT - 9, y: -4 }
			]);
		});

		it('allows a custom coordinate limit and treats an empty selection as stationary', () => {
			expect(
				translateSelection(frames({ id: 'profile', x: -9, y: 9 }), { x: -10, y: 10 }, 10)
			).toEqual({
				delta: { x: -1, y: 1 },
				positions: [{ id: 'profile', x: -10, y: 10 }]
			});
			expect(translateSelection([], { x: 40, y: 50 })).toEqual({
				delta: { x: 0, y: 0 },
				positions: []
			});
		});
	});

	describe('snapping', () => {
		it('snaps selection edges on both axes and returns drawable guide extents', () => {
			const result = snapSelection(
				frames({ id: 'profile', x: 0, y: 0 }),
				{ x: 7, y: 36 },
				frames({ id: 'contact', x: 730, y: 500 }),
				5
			);

			expect(result).toEqual({
				delta: { x: 10, y: 40 },
				guides: [
					{
						orientation: 'vertical',
						position: 730,
						start: 40,
						end: 860,
						targetFrameId: 'contact',
						movingAnchor: 'end',
						targetAnchor: 'start'
					},
					{
						orientation: 'horizontal',
						position: 500,
						start: 10,
						end: 1_250,
						targetFrameId: 'contact',
						movingAnchor: 'end',
						targetAnchor: 'start'
					}
				]
			});
		});

		it('snaps centers and resolves equal candidates deterministically', () => {
			const result = snapSelection(
				frames({ id: 'profile', x: 0, y: 0 }),
				{ x: 638, y: 448 },
				frames(
					{ id: 'contact', x: 740, y: 500 },
					{ id: 'education-columbia-university', x: 690, y: 500 }
				),
				2
			);

			expect(result.delta).toEqual({ x: 640, y: 450 });
			expect(result.guides.map((guide) => [guide.orientation, guide.targetFrameId])).toEqual([
				['vertical', 'contact'],
				['horizontal', 'contact']
			]);
			expect(result.guides.map((guide) => [guide.movingAnchor, guide.targetAnchor])).toEqual([
				['center', 'center'],
				['center', 'center']
			]);
		});

		it('uses stable anchor order to break otherwise identical snap distances', () => {
			const moving = frames({ id: 'profile', x: 0, y: 0 });
			const sameAnchorTie = snapSelection(
				moving,
				{ x: -50, y: 0 },
				frames({ id: 'contact', x: 100, y: 5_000 }),
				50
			);
			const targetAnchorTie = snapSelection(
				moving,
				{ x: 390, y: 0 },
				frames({ id: 'contact', x: 0, y: 5_000 }),
				130
			);

			expect(sameAnchorTie.delta.x).toBe(0);
			expect(sameAnchorTie.guides[0]).toMatchObject({
				movingAnchor: 'center',
				targetAnchor: 'center'
			});
			expect(targetAnchorTie.delta.x).toBe(260);
			expect(targetAnchorTie.guides[0]).toMatchObject({
				movingAnchor: 'start',
				targetAnchor: 'center'
			});
		});

		it('does not snap beyond the threshold or when either side has no candidates', () => {
			const moving = frames({ id: 'profile', x: 0, y: 0 });
			const requested = { x: 1, y: 2 };
			expect(
				snapSelection(moving, requested, frames({ id: 'contact', x: 1_000, y: 1_000 }), -1)
			).toEqual({ delta: requested, guides: [] });
			expect(snapSelection([], requested, frames({ id: 'contact', x: 0, y: 0 }))).toEqual({
				delta: requested,
				guides: []
			});
			expect(snapSelection(moving, requested, [])).toEqual({
				delta: requested,
				guides: []
			});
			expect(snapSelection(moving, requested, moving)).toEqual({
				delta: requested,
				guides: []
			});
		});
	});

	describe('alignment', () => {
		const selected = frames({ id: 'profile', x: 100, y: 200 }, { id: 'contact', x: 1_000, y: 500 });
		const expected: Record<SelectionAlignment, FramePosition[]> = {
			left: [
				{ id: 'profile', x: 100, y: 200 },
				{ id: 'contact', x: 100, y: 500 }
			],
			center: [
				{ id: 'profile', x: 450, y: 200 },
				{ id: 'contact', x: 550, y: 500 }
			],
			right: [
				{ id: 'profile', x: 800, y: 200 },
				{ id: 'contact', x: 1_000, y: 500 }
			],
			top: [
				{ id: 'profile', x: 100, y: 200 },
				{ id: 'contact', x: 1_000, y: 200 }
			],
			middle: [
				{ id: 'profile', x: 100, y: 300 },
				{ id: 'contact', x: 1_000, y: 350 }
			],
			bottom: [
				{ id: 'profile', x: 100, y: 400 },
				{ id: 'contact', x: 1_000, y: 500 }
			]
		};

		it.each(Object.keys(expected) as SelectionAlignment[])('aligns %s', (alignment) => {
			expect(alignSelection(selected, alignment)).toEqual(expected[alignment]);
		});

		it('returns an empty result for an empty selection', () => {
			expect(alignSelection([], 'left')).toEqual([]);
		});
	});

	describe('distribution', () => {
		it('distributes horizontally with equal gaps, preserved bounds, and stable input order', () => {
			const selected = frames(
				{ id: 'education-columbia-university', x: 2_380, y: 80 },
				{ id: 'profile', x: 0, y: 20 },
				{ id: 'contact', x: 1_100, y: 50 }
			);

			expect(distributeSelection(selected, 'horizontal')).toEqual([
				{ id: 'education-columbia-university', x: 2_380, y: 80 },
				{ id: 'profile', x: 0, y: 20 },
				{ id: 'contact', x: 1_290, y: 50 }
			]);
			expect(selected[2].x).toBe(1_100);
		});

		it('distributes vertically with equal gaps while preserving other coordinates', () => {
			expect(
				distributeSelection(
					frames(
						{ id: 'contact', x: 50, y: 1_000 },
						{ id: 'education-columbia-university', x: 80, y: 1_640 },
						{ id: 'profile', x: 20, y: 0 }
					),
					'vertical'
				)
			).toEqual([
				{ id: 'contact', x: 50, y: 870 },
				{ id: 'education-columbia-university', x: 80, y: 1_640 },
				{ id: 'profile', x: 20, y: 0 }
			]);
		});

		it('leaves fewer than three frames geometrically unchanged but returns copies', () => {
			const selected = frames({ id: 'profile', x: 0, y: 0 }, { id: 'contact', x: 1_000, y: 1_000 });
			const result = distributeSelection(selected, 'horizontal');

			expect(result).toEqual(selected);
			expect(result).not.toBe(selected);
			expect(result[0]).not.toBe(selected[0]);
		});

		it('uses stable input order when frames share an axis coordinate', () => {
			const selected = frames(
				{ id: 'profile', x: 0, y: 0 },
				{ id: 'contact', x: 0, y: 800 },
				{ id: 'education-columbia-university', x: 2_000, y: 1_600 }
			);

			const result = distributeSelection(selected, 'horizontal');
			expect(result[0].x).toBe(0);
			expect(result[1].x).toBe(1_100);
			expect(result[2].x).toBe(2_000);
		});
	});
});
