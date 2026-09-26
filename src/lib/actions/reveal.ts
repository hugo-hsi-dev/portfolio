import type { Action } from 'svelte/action';

type RevealOptions = {
	delay?: number;
	x?: number;
	y?: number;
	duration?: number;
	immediate?: boolean;
};

/** Enhance visible HTML with a one-time entrance; never hide it before JavaScript runs. */
export const reveal: Action<HTMLElement, RevealOptions | undefined> = (node, options = {}) => {
	const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
	let animation: Animation | undefined;
	let observer: IntersectionObserver | undefined;
	let revealed = false;

	/** Release any pending entrance animation and intersection observation. */
	function cancel() {
		animation?.cancel();
		animation = undefined;
		observer?.disconnect();
		observer = undefined;
	}

	/** Reveal once, animating only when the browser and motion preference allow it. */
	function animate() {
		cancel();
		revealed = true;
		if (preference.matches || !node.animate) return;
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
	function observe() {
		cancel();
		if (revealed || preference.matches) return;
		if (options.immediate) {
			revealed = true;
			if (window.scrollY < window.innerHeight) animate();
			return;
		}
		if (!('IntersectionObserver' in window)) return;
		observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((entry) => entry.isIntersecting)) animate();
			},
			{ threshold: 0.1 }
		);
		observer.observe(node);
	}

	/** Cancel motion when requested, or resume observation for an unrevealed node. */
	function preferenceChanged() {
		if (preference.matches) cancel();
		else observe();
	}

	observe();
	preference.addEventListener('change', preferenceChanged);

	return {
		/** Refresh entrance options without replaying a completed reveal. */
		update(value = {}) {
			options = value;
			observe();
		},
		/** Release animation resources and the motion-preference listener. */
		destroy() {
			cancel();
			preference.removeEventListener('change', preferenceChanged);
		}
	};
};
