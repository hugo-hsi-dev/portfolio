import assert from 'node:assert/strict';
import test from 'node:test';
import { enhancePortfolio } from '../src/scripts/portfolio.ts';

class Element extends EventTarget {
	dataset: Record<string, string> = {};
	textContent = '';
	hidden = false;
	children = new Map<string, Element>();
	classes = new Set<string>();
	properties = new Map<string, string>();
	classList = {
		add: (name: string) => this.classes.add(name),
		remove: (name: string) => this.classes.delete(name),
		toggle: (name: string, enabled: boolean) =>
			enabled ? this.classes.add(name) : this.classes.delete(name)
	};
	style = {
		setProperty: (name: string, value: string) => this.properties.set(name, value),
		removeProperty: (name: string) => this.properties.delete(name)
	};
	querySelector(selector: string) {
		return this.children.get(selector) ?? null;
	}
}

function setup(reducedMotion: boolean, scrollY = 0) {
	const reduced = Object.assign(new EventTarget(), { matches: reducedMotion });
	const fine = Object.assign(new EventTarget(), { matches: true });
	const windowMock = Object.assign(new EventTarget(), {
		scrollY,
		innerHeight: 800,
		matchMedia: (query: string) => (query.includes('reduced-motion') ? reduced : fine)
	});
	const nodes = new Map<string, Element[]>();
	const root = {
		querySelectorAll: (selector: string) => nodes.get(selector) ?? [],
		querySelector: (selector: string) => nodes.get(selector)?.[0] ?? null
	};
	let frame: FrameRequestCallback | undefined;
	const previous = new Map<string, PropertyDescriptor | undefined>();
	for (const [key, value] of Object.entries({
		window: windowMock,
		IntersectionObserver: undefined,
		requestAnimationFrame: (callback: FrameRequestCallback) => {
			frame = callback;
			return 1;
		},
		cancelAnimationFrame: () => {
			frame = undefined;
		}
	})) {
		previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
		Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
	}
	const typewriter = new Element();
	typewriter.dataset.text = 'Hello';
	const visible = new Element();
	visible.textContent = 'Hello';
	const tail = new Element();
	const cursor = new Element();
	cursor.hidden = true;
	typewriter.children.set('[data-typewriter-visible]', visible);
	typewriter.children.set('[data-typewriter-tail]', tail);
	typewriter.children.set('[data-typewriter-cursor]', cursor);
	const hero = new Element();
	hero.dataset.reveal = 'hero';
	const body = new Element();
	const nav = new Element();
	nodes.set('[data-typewriter]', [typewriter]);
	nodes.set('[data-reveal]', [hero, body]);
	nodes.set('[data-hero-name]', [hero]);
	nodes.set('[data-nav-name]', [nav]);
	return {
		root: root as unknown as Document,
		reduced,
		visible,
		tail,
		cursor,
		hero,
		body,
		nav,
		frame: () => frame,
		restore: () => {
			for (const [key, descriptor] of previous) {
				if (descriptor) Object.defineProperty(globalThis, key, descriptor);
				else Reflect.deleteProperty(globalThis, key);
			}
		}
	};
}

test('reduced motion leaves complete text and visible content without IntersectionObserver', () => {
	const env = setup(true);
	try {
		const cleanup = enhancePortfolio(env.root);
		assert.equal(env.visible.textContent, 'Hello');
		assert.equal(env.tail.textContent, '');
		assert.equal(env.cursor.hidden, true);
		assert.equal(env.hero.classes.size, 0);
		assert.equal(env.body.classes.size, 0);
		assert.ok(env.nav.classes.has('is-visible'));
		assert.equal(env.frame(), undefined);
		cleanup();
	} finally {
		env.restore();
	}
});

test('restored scroll skips typing and hero entrances', () => {
	const env = setup(false, 900);
	try {
		const cleanup = enhancePortfolio(env.root);
		assert.equal(env.visible.textContent, 'Hello');
		assert.equal(env.hero.classes.size, 0);
		assert.equal(env.frame(), undefined);
		cleanup();
	} finally {
		env.restore();
	}
});

test('enabling reduced motion during typing completes text and consumes entrances', () => {
	const env = setup(false);
	try {
		const cleanup = enhancePortfolio(env.root);
		assert.equal(env.visible.textContent, '');
		assert.equal(env.tail.textContent, 'Hello');
		assert.ok(env.hero.classes.has('reveal-waiting'));
		assert.equal(env.cursor.hidden, false);
		env.reduced.matches = true;
		env.reduced.dispatchEvent(new Event('change'));
		assert.equal(env.visible.textContent, 'Hello');
		assert.equal(env.cursor.hidden, true);
		assert.equal(env.frame(), undefined);
		assert.equal(env.hero.classes.size, 0);
		env.reduced.matches = false;
		env.reduced.dispatchEvent(new Event('change'));
		assert.equal(env.hero.classes.size, 0);
		cleanup();
	} finally {
		env.restore();
	}
});

test('persisted restoration at the top keeps completed content and consumes entrances', () => {
	const env = setup(false);
	try {
		const beforeNavigation = enhancePortfolio(env.root);
		assert.equal(env.visible.textContent, '');
		beforeNavigation();
		assert.equal(env.visible.textContent, 'Hello');
		const afterRestore = enhancePortfolio(env.root, { skipEntrances: true });
		assert.equal(env.visible.textContent, 'Hello');
		assert.equal(env.tail.textContent, '');
		assert.equal(env.cursor.hidden, true);
		assert.equal(env.frame(), undefined);
		assert.equal(env.hero.classes.size, 0);
		assert.equal(env.body.classes.size, 0);
		env.reduced.matches = true;
		env.reduced.dispatchEvent(new Event('change'));
		env.reduced.matches = false;
		env.reduced.dispatchEvent(new Event('change'));
		assert.equal(env.hero.classes.size, 0);
		assert.equal(env.body.classes.size, 0);
		afterRestore();
	} finally {
		env.restore();
	}
});
