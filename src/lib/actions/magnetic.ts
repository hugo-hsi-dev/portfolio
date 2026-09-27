import type { Action } from 'svelte/action';

/** Keep the action's hit area still; move only its [data-magnetic-content] child. */
export const magnetic: Action<HTMLElement, number | undefined> = (node, intensity = 0.3) => {
	const content = node.querySelector<HTMLElement>('[data-magnetic-content]');
	if (!content) return;

	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
	const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
	const originalTranslate = content.style.translate;

	/** Allow pointer motion only for fine pointers without a reduced-motion preference. */
	function enabled() {
		return finePointer.matches && !reducedMotion.matches;
	}

	/** Restore the child translation that existed before this action mounted. */
	function reset() {
		content!.style.translate = originalTranslate;
	}

	/** Offset the child from the pointer while keeping the parent hit area stationary. */
	function move(event: PointerEvent) {
		if (!enabled() || event.pointerType === 'touch') return;
		const bounds = node.getBoundingClientRect();
		const x = (event.clientX - bounds.left - bounds.width / 2) * intensity;
		const y = (event.clientY - bounds.top - bounds.height / 2) * intensity;
		// Tailwind's translate transition on the content handles interpolation.
		content!.style.translate = `${x}px ${y}px`;
	}

	/** Clear a magnetic offset when an input or motion preference disables the effect. */
	function preferenceChanged() {
		if (!enabled()) reset();
	}

	node.addEventListener('pointermove', move);
	node.addEventListener('pointerleave', reset);
	node.addEventListener('pointercancel', reset);
	window.addEventListener('blur', reset);
	reducedMotion.addEventListener('change', preferenceChanged);
	finePointer.addEventListener('change', preferenceChanged);

	return {
		/** Apply a new pointer displacement multiplier. */
		update(value = 0.3) {
			intensity = value;
		},
		/** Restore the child and release the pointer and media-query listeners. */
		destroy() {
			reset();
			node.removeEventListener('pointermove', move);
			node.removeEventListener('pointerleave', reset);
			node.removeEventListener('pointercancel', reset);
			window.removeEventListener('blur', reset);
			reducedMotion.removeEventListener('change', preferenceChanged);
			finePointer.removeEventListener('change', preferenceChanged);
		}
	};
};
