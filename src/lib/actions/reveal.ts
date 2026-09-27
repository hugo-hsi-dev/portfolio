import type { Action } from 'svelte/action';

export type RevealOptions = {
	delay?: number;
	x?: number;
	y?: number;
	duration?: number;
	immediate?: boolean;
};

const pending = new Map<Element, () => void>();
const consumers = new Set<() => void>();
let observer: IntersectionObserver | undefined;
let preference: MediaQueryList | undefined;

/** Cancel motion when requested, or resume observation for unrevealed nodes. */
function preferenceChanged() {
	for (const notify of consumers) notify();
}

/** Share motion preferences while any target remains mounted. */
function subscribe(notify: () => void) {
	if (!preference) {
		preference = window.matchMedia('(prefers-reduced-motion: reduce)');
		preference.addEventListener('change', preferenceChanged);
	}
	consumers.add(notify);
	return () => {
		consumers.delete(notify);
		if (consumers.size) return;
		preference?.removeEventListener('change', preferenceChanged);
		preference = undefined;
		observer?.disconnect();
		observer = undefined;
		pending.clear();
	};
}

/** Remove only this target, leaving other entrances scheduled. */
function stopObserving(node: HTMLElement) {
	if (pending.delete(node)) observer?.unobserve(node);
}

/** Lazily share viewport observation across reveal targets. */
function observe(node: HTMLElement, animate: () => void) {
	if (!('IntersectionObserver' in window)) return;
	observer ??= new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) pending.get(entry.target)?.();
			}
		},
		{ threshold: 0.1 }
	);
	pending.set(node, animate);
	observer.observe(node);
}

/** Enhance visible HTML with a one-time entrance; never hide it before JavaScript runs. */
export const reveal: Action<HTMLElement, RevealOptions | false | undefined> = (
	node,
	options = {}
) => {
	if (typeof window === 'undefined') return;
	let animation: Animation | undefined;
	let revealed = false;

	/** Release any pending entrance animation and intersection observation. */
	function cancel() {
		animation?.cancel();
		animation = undefined;
		stopObserving(node);
	}

	/** Reveal once, animating only when the browser and motion preference allow it. */
	function animate() {
		cancel();
		revealed = true;
		if (options === false || preference?.matches || !node.animate) return;
		const { delay = 0, x = 0, y = 40, duration = 600 } = options;
		animation = node.animate(
			[
				{ opacity: 0, translate: `${x}px ${y}px` },
				{ opacity: 1, translate: '0px 0px' }
			],
			{ duration, delay, easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', fill: 'backwards' }
		);
		animation.onfinish = () => {
			animation = undefined;
		};
	}

	/** Schedule the entrance immediately above the fold or when the node enters view. */
	function refresh() {
		cancel();
		if (options === false || revealed || preference?.matches) return;
		if (options.immediate) {
			revealed = true;
			if (window.scrollY < window.innerHeight) animate();
			return;
		}
		observe(node, animate);
	}

	const unsubscribe = subscribe(refresh);
	refresh();
	return {
		/** Refresh entrance options without replaying a completed reveal. */
		update(value = {}) {
			options = value;
			refresh();
		},
		/** Release animation resources and the motion-preference listener. */
		destroy() {
			cancel();
			unsubscribe();
		}
	};
};
