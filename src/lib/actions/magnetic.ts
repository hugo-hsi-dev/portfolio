import type { Action } from 'svelte/action';

/** Keep the action's hit area still; move only its [data-magnetic-content] child. */
export const magnetic: Action<HTMLElement, number | undefined> = (node, intensity = 0.3) => {
	const content = node.querySelector<HTMLElement>('[data-magnetic-content]');
	if (!content) return;

	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
	const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
	const originalTranslate = content.style.translate;
	let frame = 0;
	let previousTime = 0;
	let x = 0;
	let y = 0;
	let velocityX = 0;
	let velocityY = 0;
	let targetX = 0;
	let targetY = 0;

	function enabled() {
		return finePointer.matches && !reducedMotion.matches;
	}

	function reset() {
		cancelAnimationFrame(frame);
		frame = 0;
		previousTime = 0;
		x = y = velocityX = velocityY = targetX = targetY = 0;
		content!.style.translate = originalTranslate;
	}

	function animate(time: number) {
		// Small integration steps preserve the spring across different refresh rates.
		let remaining = previousTime ? Math.min((time - previousTime) / 1000, 0.064) : 1 / 60;
		previousTime = time;
		while (remaining > 0) {
			const step = Math.min(remaining, 1 / 240);
			velocityX += ((targetX - x) * 150 - velocityX * 15) * step;
			velocityY += ((targetY - y) * 150 - velocityY * 15) * step;
			x += velocityX * step;
			y += velocityY * step;
			remaining -= step;
		}

		const settled =
			Math.abs(targetX - x) + Math.abs(targetY - y) < 0.01 &&
			Math.abs(velocityX) + Math.abs(velocityY) < 0.01;
		if (settled) {
			x = targetX;
			y = targetY;
			velocityX = velocityY = 0;
		}
		content!.style.translate = x === 0 && y === 0 ? originalTranslate : `${x}px ${y}px`;
		frame = settled ? 0 : requestAnimationFrame(animate);
		if (settled) previousTime = 0;
	}

	function start() {
		if (!frame) frame = requestAnimationFrame(animate);
	}

	function move(event: PointerEvent) {
		if (!enabled() || event.pointerType === 'touch') return;
		const bounds = node.getBoundingClientRect();
		targetX = (event.clientX - bounds.left - bounds.width / 2) * intensity;
		targetY = (event.clientY - bounds.top - bounds.height / 2) * intensity;
		start();
	}

	function leave() {
		targetX = targetY = 0;
		if (enabled()) start();
		else reset();
	}

	function preferenceChanged() {
		if (!enabled()) reset();
	}

	node.addEventListener('pointermove', move);
	node.addEventListener('pointerleave', leave);
	node.addEventListener('pointercancel', leave);
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
			node.removeEventListener('pointerleave', leave);
			node.removeEventListener('pointercancel', leave);
			window.removeEventListener('blur', reset);
			reducedMotion.removeEventListener('change', preferenceChanged);
			finePointer.removeEventListener('change', preferenceChanged);
		}
	};
};
