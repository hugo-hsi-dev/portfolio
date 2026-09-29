import type { Action } from 'svelte/action';
import { on } from 'svelte/events';
import { prefersReducedMotion } from 'svelte/motion';

export type RevealOptions = {
	delay?: number;
	x?: number;
	y?: number;
	duration?: number;
	immediate?: boolean;
};

/** Enhance visible HTML with a one-time CSS entrance; never hide it before JavaScript runs. */
export const reveal: Action<HTMLElement, RevealOptions | false | undefined> = (
	node,
	options = {}
) => {
	if (typeof window === 'undefined') return;
	let revealed = false;
	let observer: IntersectionObserver | undefined;
	let removeListeners: (() => void)[] = [];

	function clearAnimation() {
		for (const remove of removeListeners) remove();
		removeListeners = [];
		node.classList.remove('animate-reveal');
		for (const property of ['--reveal-delay', '--reveal-x', '--reveal-y', '--reveal-duration']) {
			node.style.removeProperty(property);
		}
	}

	function cancel() {
		clearAnimation();
		observer?.disconnect();
		observer = undefined;
	}

	/** Consume the entrance even when reduced motion skips or cancels it. */
	function animate() {
		cancel();
		revealed = true;
		if (options === false || prefersReducedMotion.current) return;
		const { delay = 0, x = 0, y = 40, duration = 600 } = options;
		node.style.setProperty('--reveal-delay', `${delay}ms`);
		node.style.setProperty('--reveal-x', `${x}px`);
		node.style.setProperty('--reveal-y', `${y}px`);
		node.style.setProperty('--reveal-duration', `${duration}ms`);
		const finished = (event: AnimationEvent) => {
			if (event.target === node && event.animationName === 'reveal') clearAnimation();
		};
		removeListeners = [on(node, 'animationend', finished), on(node, 'animationcancel', finished)];
		node.classList.add('animate-reveal');
	}

	function refresh() {
		cancel();
		if (options === false || revealed) return;
		if (prefersReducedMotion.current) {
			revealed = true;
			return;
		}
		if (options.immediate) {
			revealed = true;
			if (window.scrollY < window.innerHeight) animate();
			return;
		}
		if (typeof IntersectionObserver === 'undefined') return;
		observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((entry) => entry.isIntersecting)) animate();
			},
			{ threshold: 0.1 }
		);
		observer.observe(node);
	}

	refresh();
	return {
		update(value = {}) {
			options = value;
			refresh();
		},
		destroy: cancel
	};
};
