import assert from 'node:assert/strict';
import { getEventListeners } from 'node:events';
import { test, type TestContext } from 'node:test';
import { prefersReducedMotion } from 'svelte/motion';
import { reveal } from '../src/lib/actions/reveal.ts';

/** Observe and trigger real action lifecycles without a browser engine. */
function browser(t: TestContext) {
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
		disconnect() {
			this.nodes.clear();
			this.disconnected = true;
		}
		enter(node: Element, isIntersecting = true) {
			if (!this.disconnected) {
				this.callback(
					[{ isIntersecting, target: node } as IntersectionObserverEntry],
					this as unknown as IntersectionObserver
				);
			}
		}
	}
	const window = { scrollY: 0, innerHeight: 800 };
	for (const [key, value] of Object.entries({ window, IntersectionObserver: Observer })) {
		const previous = Object.getOwnPropertyDescriptor(globalThis, key);
		Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
		t.after(() => {
			if (previous) Object.defineProperty(globalThis, key, previous);
			else Reflect.deleteProperty(globalThis, key);
		});
	}
	const preference = Object.getOwnPropertyDescriptor(prefersReducedMotion, 'current')!;
	t.after(() => Object.defineProperty(prefersReducedMotion, 'current', preference));
	const reduceMotion = (value: boolean) => {
		Object.defineProperty(prefersReducedMotion, 'current', { ...preference, value });
	};
	return { window, observers, reduceMotion };
}

function element() {
	const classes = new Set<string>();
	const properties = new Map<string, string>();
	const node = Object.assign(new EventTarget(), {
		classList: {
			add: (value: string) => classes.add(value),
			remove: (value: string) => classes.delete(value)
		},
		style: {
			setProperty: (name: string, value: string) => properties.set(name, value),
			removeProperty: (name: string) => properties.delete(name)
		}
	}) as unknown as HTMLElement;
	const finish = (type = 'animationend', animationName = 'reveal') =>
		node.dispatchEvent(Object.assign(new Event(type), { animationName }));
	return { node, classes, properties, finish };
}

test('reveal leaves server-rendered content alone', () => {
	assert.equal(reveal({} as HTMLElement), undefined);
});

test('viewport entrance runs once and releases its observer and completed animation listeners', (t) => {
	const { observers } = browser(t);
	const { node, classes, properties, finish } = element();
	const action = reveal(node);
	assert.equal(classes.size, 0);
	assert.ok(observers[0].nodes.has(node));
	observers[0].enter(node, false);
	assert.equal(classes.size, 0);
	observers[0].enter(node);
	assert.ok(classes.has('animate-reveal'));
	assert.equal(observers[0].disconnected, true);
	finish('animationend', 'unrelated');
	assert.ok(classes.has('animate-reveal'));
	finish();
	assert.equal(classes.size, 0);
	assert.equal(properties.size, 0);
	assert.equal(getEventListeners(node, 'animationend').length, 0);
	assert.equal(getEventListeners(node, 'animationcancel').length, 0);
	action?.update?.({});
	assert.equal(observers.length, 1, 'completed entrances do not replay');
	action?.destroy?.();
});

test('CSS animation cancellation releases state without replaying the entrance', (t) => {
	const { observers } = browser(t);
	const { node, classes, properties, finish } = element();
	const action = reveal(node, { immediate: true });
	assert.ok(classes.has('animate-reveal'));
	finish('animationcancel');
	assert.equal(classes.size, 0);
	assert.equal(properties.size, 0);
	action?.update?.({ immediate: true });
	assert.equal(classes.size, 0);
	assert.equal(observers.length, 0);
	action?.destroy?.();
});

test('immediate entrance skips restored scroll and preserves configured motion', (t) => {
	const { window, observers } = browser(t);
	const skipped = element();
	window.scrollY = window.innerHeight;
	reveal(skipped.node, { immediate: true })?.destroy?.();
	assert.equal(skipped.classes.size, 0);
	window.scrollY = 0;
	const active = element();
	const action = reveal(active.node, { immediate: true, delay: 100, duration: 400, x: 20, y: 10 });
	assert.deepEqual(Object.fromEntries(active.properties), {
		'--reveal-delay': '100ms',
		'--reveal-duration': '400ms',
		'--reveal-x': '20px',
		'--reveal-y': '10px'
	});
	action?.destroy?.();
	assert.equal(active.classes.size, 0);
	assert.equal(active.properties.size, 0);
	assert.equal(getEventListeners(active.node, 'animationend').length, 0);
	assert.equal(observers.length, 0);
});

test('disabling or destroying a pending entrance disconnects observation', (t) => {
	const { observers } = browser(t);
	const { node, classes } = element();
	const action = reveal(node, false);
	assert.equal(observers.length, 0);
	action?.update?.({ delay: 50 });
	assert.ok(observers[0].nodes.has(node));
	action?.update?.(false);
	assert.equal(observers[0].disconnected, true);
	observers[0].enter(node);
	assert.equal(classes.size, 0);
	action?.update?.({ delay: 100 });
	assert.ok(observers[1].nodes.has(node));
	action?.destroy?.();
	assert.equal(observers[1].disconnected, true);
	observers[1].enter(node);
	assert.equal(classes.size, 0);
});

test('reduced motion consumes an entrance instead of replaying it when preferences change', (t) => {
	const { observers, reduceMotion } = browser(t);
	reduceMotion(true);
	const initial = element();
	const a = reveal(initial.node);
	assert.equal(observers.length, 0);
	reduceMotion(false);
	a?.update?.({});
	assert.equal(observers.length, 0);
	const pending = element();
	const b = reveal(pending.node);
	reduceMotion(true);
	observers[0].enter(pending.node);
	assert.equal(pending.classes.size, 0);
	reduceMotion(false);
	b?.update?.({});
	assert.equal(observers.length, 1);
	a?.destroy?.();
	b?.destroy?.();
});

test('content remains visible without IntersectionObserver', (t) => {
	browser(t);
	Reflect.deleteProperty(globalThis, 'IntersectionObserver');
	const { node, classes, properties } = element();
	const action = reveal(node);
	assert.equal(classes.size, 0);
	assert.equal(properties.size, 0);
	action?.destroy?.();
});

test('reveal waits for readiness before starting the delayed CSS entrance', (t) => {
	const { observers } = browser(t);
	const { node, classes, properties } = element();
	const action = reveal(node, { immediate: true, ready: false });
	assert.ok(classes.has('reveal-waiting'));
	assert.equal(classes.has('animate-reveal'), false);
	assert.equal(properties.size, 0);
	assert.equal(observers.length, 0);
	action?.update?.({ immediate: true, ready: true, delay: 150 });
	assert.equal(classes.has('reveal-waiting'), false);
	assert.ok(classes.has('animate-reveal'));
	assert.equal(properties.get('--reveal-delay'), '150ms');
	action?.destroy?.();
});

test('reduced motion releases waiting content and cleanup removes the gate', (t) => {
	const { reduceMotion } = browser(t);
	const { node, classes } = element();
	const action = reveal(node, { immediate: true, ready: false });
	assert.ok(classes.has('reveal-waiting'));
	reduceMotion(true);
	action?.update?.({ immediate: true, ready: true });
	assert.equal(classes.size, 0);
	action?.destroy?.();
	reduceMotion(false);
	const waiting = reveal(node, { immediate: true, ready: false });
	assert.ok(classes.has('reveal-waiting'));
	waiting?.destroy?.();
	assert.equal(classes.size, 0);
});

test('waiting immediate reveals remain visible for restored scroll', (t) => {
	const { window } = browser(t);
	const { node, classes } = element();
	window.scrollY = window.innerHeight;
	const action = reveal(node, { immediate: true, ready: false });
	assert.equal(classes.size, 0);
	action?.update?.({ immediate: true, ready: true });
	assert.equal(classes.size, 0);
	action?.destroy?.();
});
