import type { Action } from 'svelte/action';

/** Keep the action's hit area still; move only its [data-magnetic-content] child. */
export const magnetic: Action<HTMLElement, number | undefined> = (node, intensity = 0.3) => {
	const content = node.querySelector<HTMLElement>('[data-magnetic-content]');
	if (!content) return;

	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
	const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
	const originalTranslate = content.style.translate;

	function enabled() {
		return finePointer.matches && !reducedMotion.matches;
	}

	function reset() {
		content!.style.translate = originalTranslate;
	}

	function move(event: PointerEvent) {
		if (!enabled() || event.pointerType === 'touch') return;
		const bounds = node.getBoundingClientRect();
		const x = (event.clientX - bounds.left - bounds.width / 2) * intensity;
		const y = (event.clientY - bounds.top - bounds.height / 2) * intensity;
		// Tailwind's translate transition on the content handles interpolation.
		content!.style.translate = `${x}px ${y}px`;
	}

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
		update(value = 0.3) {
			intensity = value;
		},
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
