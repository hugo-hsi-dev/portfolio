import assert from 'node:assert/strict';
import { getEventListeners } from 'node:events';
import { test, type TestContext } from 'node:test';
import { magnetic } from '../src/lib/actions/magnetic.ts';
import { reveal } from '../src/lib/actions/reveal.ts';

class Preference extends EventTarget {
	matches: boolean;
	constructor(matches: boolean) {
		super();
		this.matches = matches;
	}
	change(matches: boolean) {
		this.matches = matches;
		this.dispatchEvent(new Event('change'));
	}
}

function browser(t: TestContext) {
	const reduced = new Preference(false);
	const fine = new Preference(true);
	const observers: Observer[] = [];
	class Observer {
		callback: IntersectionObserverCallback;
		nodes = new Set<Element>();
		disconnected = false;
		constructor(callback: IntersectionObserverCallback) {
			this.callback = callback;
			observers.push(this);
		}
		observe(node: Element) {
			this.nodes.add(node);
		}
		unobserve(node: Element) {
			this.nodes.delete(node);
		}
		disconnect() {
			this.nodes.clear();
			this.disconnected = true;
		}
		enter(node = this.nodes.values().next().value) {
			if (!this.disconnected) {
				this.callback(
					[{ isIntersecting: true, target: node } as IntersectionObserverEntry],
					this as unknown as IntersectionObserver
				);
			}
		}
	}
	const window = Object.assign(new EventTarget(), {
		matchMedia: (query: string) => (query.includes('reduced') ? reduced : fine),
		scrollY: 0,
		innerHeight: 800,
		IntersectionObserver: Observer
	});
	for (const [key, value] of Object.entries({ window, IntersectionObserver: Observer })) {
		const previous = Object.getOwnPropertyDescriptor(globalThis, key);
		Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
		t.after(() => {
			if (previous) Object.defineProperty(globalThis, key, previous);
			else Reflect.deleteProperty(globalThis, key);
		});
	}
	return { window, reduced, fine, observers };
}

function animatedElement() {
	const animations: { cancelled: boolean; options: KeyframeAnimationOptions }[] = [];
	const node = {
		animate(_frames: Keyframe[], options: KeyframeAnimationOptions) {
			const animation = {
				cancelled: false,
				options,
				cancel() {
					this.cancelled = true;
				}
			};
			animations.push(animation);
			return animation;
		}
	} as unknown as HTMLElement;
	return { node, animations };
}

test('magnetic sets targets and restores the original translate on preferences and cleanup', (t) => {
	const { reduced, fine, window } = browser(t);
	const content = { style: { translate: '3px 4px' } };
	const node = Object.assign(new EventTarget(), {
		querySelector: () => content,
		getBoundingClientRect: () => ({ left: 10, top: 20, width: 100, height: 100 })
	}) as unknown as HTMLElement;
	const action = magnetic(node);
	const move = (pointerType = 'mouse') =>
		node.dispatchEvent(
			Object.assign(new Event('pointermove'), { pointerType, clientX: 100, clientY: 90 })
		);
	move();
	assert.equal(content.style.translate, '12px 6px');
	node.dispatchEvent(new Event('pointerleave'));
	assert.equal(content.style.translate, '3px 4px');
	move('touch');
	assert.equal(content.style.translate, '3px 4px');
	move();
	reduced.change(true);
	assert.equal(content.style.translate, '3px 4px');
	move();
	assert.equal(content.style.translate, '3px 4px');
	reduced.change(false);
	move();
	fine.change(false);
	assert.equal(content.style.translate, '3px 4px');
	fine.change(true);
	action?.update?.(0.5);
	move();
	assert.equal(content.style.translate, '20px 10px');
	window.dispatchEvent(new Event('blur'));
	assert.equal(content.style.translate, '3px 4px');
	move();
	action?.destroy?.();
	assert.equal(content.style.translate, '3px 4px');
	move();
	assert.equal(content.style.translate, '3px 4px');
});

test('reveal observes its own node once and cancels when reduced motion becomes active', (t) => {
	const { observers, reduced } = browser(t);
	const { node, animations } = animatedElement();
	const action = reveal(node);
	assert.equal(animations.length, 0);
	assert.equal(observers[0].nodes.has(node), true);
	observers[0].enter();
	assert.equal(animations.length, 1);
	assert.equal(observers[0].nodes.size, 0);
	observers[0].enter(node);
	assert.equal(animations.length, 1);
	reduced.change(true);
	assert.equal(animations[0].cancelled, true);
	reduced.change(false);
	assert.equal(animations.length, 1);
	action?.destroy?.();
});

test('immediate reveal skips restored scroll and cancels active animation on destroy', (t) => {
	const { window, reduced, observers } = browser(t);
	const { node, animations } = animatedElement();
	window.scrollY = window.innerHeight;
	const skipped = reveal(node, { immediate: true });
	assert.equal(animations.length, 0);
	skipped?.destroy?.();
	window.scrollY = 0;
	const active = reveal(node, { immediate: true, delay: 100, duration: 400, y: 10 });
	assert.equal(animations.length, 1);
	assert.equal(animations[0].options.delay, 100);
	assert.equal(animations[0].options.duration, 400);
	active?.destroy?.();
	assert.equal(animations[0].cancelled, true);
	reduced.change(true);
	reduced.change(false);
	assert.equal(animations.length, 1);
	assert.equal(observers.length, 0);
});

test('destroy disconnects a pending reveal and removes its preference listener', (t) => {
	const { observers, reduced } = browser(t);
	const { node, animations } = animatedElement();
	const action = reveal(node);
	action?.destroy?.();
	assert.equal(observers[0].disconnected, true);
	observers[0].enter();
	reduced.change(true);
	reduced.change(false);
	assert.equal(observers.length, 1);
	assert.equal(animations.length, 0);
});

test('reveals share one observer and listener while targets retain independent lifecycles', (t) => {
	const { observers, reduced } = browser(t);
	const first = animatedElement();
	const second = animatedElement();
	const a = reveal(first.node);
	const b = reveal(second.node);
	assert.equal(observers.length, 1);
	assert.equal(observers[0].nodes.size, 2);
	assert.equal(getEventListeners(reduced, 'change').length, 1);
	a?.destroy?.();
	assert.equal(observers[0].disconnected, false);
	assert.equal(observers[0].nodes.size, 1);
	assert.equal(getEventListeners(reduced, 'change').length, 1);
	observers[0].enter(first.node);
	assert.equal(first.animations.length, 0);
	observers[0].enter(second.node);
	assert.equal(second.animations.length, 1);
	observers[0].enter(second.node);
	assert.equal(second.animations.length, 1);
	b?.destroy?.();
	assert.equal(second.animations[0].cancelled, true);
	assert.equal(observers[0].disconnected, true);
	assert.equal(getEventListeners(reduced, 'change').length, 0);
});

test('reduced motion pauses pending reveals and cancels all active entrances', (t) => {
	const { observers, reduced } = browser(t);
	reduced.change(true);
	const first = animatedElement();
	const second = animatedElement();
	const a = reveal(first.node);
	const b = reveal(second.node);
	assert.equal(observers.length, 0);
	reduced.change(false);
	assert.equal(observers.length, 1);
	assert.equal(observers[0].nodes.size, 2);
	reduced.change(true);
	assert.equal(observers[0].nodes.size, 0);
	observers[0].enter(first.node);
	assert.equal(first.animations.length, 0);
	reduced.change(false);
	observers[0].enter(first.node);
	observers[0].enter(second.node);
	reduced.change(true);
	assert.equal(first.animations[0].cancelled, true);
	assert.equal(second.animations[0].cancelled, true);
	reduced.change(false);
	assert.equal(observers[0].nodes.size, 0);
	a?.destroy?.();
	b?.destroy?.();
});

test('disabled reveals can be enabled and pending reveals can be disabled', (t) => {
	const { observers } = browser(t);
	const { node, animations } = animatedElement();
	const action = reveal(node, false);
	assert.equal(observers.length, 0);
	action?.update?.({ delay: 50 });
	assert.equal(observers[0].nodes.has(node), true);
	action?.update?.(false);
	observers[0].enter(node);
	assert.equal(animations.length, 0);
	action?.update?.({ delay: 100 });
	observers[0].enter(node);
	assert.equal(animations[0].options.delay, 100);
	action?.destroy?.();
});

test('reveal remains visible when IntersectionObserver is unavailable', (t) => {
	const { window, reduced } = browser(t);
	Reflect.deleteProperty(window, 'IntersectionObserver');
	const { node, animations } = animatedElement();
	const action = reveal(node);
	assert.equal(animations.length, 0);
	action?.destroy?.();
	assert.equal(getEventListeners(reduced, 'change').length, 0);
});

test('reveal does not touch browser APIs during server rendering', () => {
	const { node, animations } = animatedElement();
	assert.equal(reveal(node), undefined);
	assert.equal(animations.length, 0);
});

test('reveal recreates shared resources after the last target is destroyed', (t) => {
	const { observers, reduced } = browser(t);
	const first = reveal(animatedElement().node);
	first?.destroy?.();
	const second = animatedElement();
	const next = reveal(second.node);
	assert.equal(observers.length, 2);
	assert.equal(getEventListeners(reduced, 'change').length, 1);
	observers[1].enter(second.node);
	assert.equal(second.animations.length, 1);
	next?.destroy?.();
	assert.equal(getEventListeners(reduced, 'change').length, 0);
});
