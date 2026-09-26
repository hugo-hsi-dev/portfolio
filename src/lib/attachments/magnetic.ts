import type { Attachment } from 'svelte/attachments';

const enabledQuery =
	'(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)';

/**
 * Pull the [data-magnetic-content] child toward the pointer by setting --magnetic-x/y.
 * The hit area stays still; CSS transitions on the child animate the movement.
 */
export function magnetic(intensity = 0.3): Attachment<HTMLElement> {
	return (node) => {
		const content = node.querySelector<HTMLElement>('[data-magnetic-content]');
		if (!content) return;
		const enabled = window.matchMedia(enabledQuery);

		function move(event: PointerEvent) {
			if (!enabled.matches || event.pointerType === 'touch') return;
			const bounds = node.getBoundingClientRect();
			const x = (event.clientX - bounds.left - bounds.width / 2) * intensity;
			const y = (event.clientY - bounds.top - bounds.height / 2) * intensity;
			content!.style.setProperty('--magnetic-x', `${x}px`);
			content!.style.setProperty('--magnetic-y', `${y}px`);
		}

		function reset() {
			content!.style.removeProperty('--magnetic-x');
			content!.style.removeProperty('--magnetic-y');
		}

		node.addEventListener('pointermove', move);
		node.addEventListener('pointerleave', reset);
		node.addEventListener('pointercancel', reset);
		window.addEventListener('blur', reset);
		enabled.addEventListener('change', reset);

		return () => {
			reset();
			node.removeEventListener('pointermove', move);
			node.removeEventListener('pointerleave', reset);
			node.removeEventListener('pointercancel', reset);
			window.removeEventListener('blur', reset);
			enabled.removeEventListener('change', reset);
		};
	};
}
