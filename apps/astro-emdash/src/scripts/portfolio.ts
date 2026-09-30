/** Progressive enhancement only: the server renders complete, visible content. */
export function enhancePortfolio(
	root: Document = document,
	{ skipEntrances = false }: { skipEntrances?: boolean } = {}
): () => void {
	const cleanups: (() => void)[] = [];
	const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
	const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
	const motionUpdates: (() => void)[] = [];
	const pointerUpdates: (() => void)[] = [];
	let disposed = false;
	let typingComplete = false;

	function listen(target: EventTarget, type: string, listener: EventListener) {
		target.addEventListener(type, listener);
		cleanups.push(() => target.removeEventListener(type, listener));
	}

	const refreshReveals: (() => void)[] = [];
	for (const node of root.querySelectorAll<HTMLElement>('[data-reveal]')) {
		let revealed = skipEntrances;
		let observer: IntersectionObserver | undefined;
		const immediate = node.dataset.reveal === 'hero';
		const clearAnimation = () => {
			node.classList.remove('animate-reveal');
			for (const key of ['delay', 'x', 'y', 'duration']) {
				node.style.removeProperty(`--reveal-${key}`);
			}
		};
		const cancel = () => {
			clearAnimation();
			node.classList.remove('reveal-waiting');
			observer?.disconnect();
			observer = undefined;
		};
		const animate = () => {
			cancel();
			revealed = true;
			if (reduced.matches) return;
			for (const [key, fallback, unit] of [
				['delay', 0, 'ms'],
				['x', 0, 'px'],
				['y', 40, 'px'],
				['duration', 600, 'ms']
			] as const) {
				const value = Number(node.dataset[key] ?? fallback);
				node.style.setProperty(
					`--reveal-${key}`,
					`${Number.isFinite(value) ? value : fallback}${unit}`
				);
			}
			node.classList.add('animate-reveal');
		};
		const refresh = () => {
			cancel();
			if (revealed) return;
			if (reduced.matches) {
				revealed = true;
				return;
			}
			if (immediate) {
				if (!typingComplete) {
					if (window.scrollY < window.innerHeight) node.classList.add('reveal-waiting');
					return;
				}
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
		};
		const finished: EventListener = (event) => {
			if (event.target === node && (event as AnimationEvent).animationName === 'reveal')
				clearAnimation();
		};
		listen(node, 'animationend', finished);
		listen(node, 'animationcancel', finished);
		refreshReveals.push(refresh);
		motionUpdates.push(refresh);
		cleanups.push(cancel);
		refresh();
	}

	const typewriters = [...root.querySelectorAll<HTMLElement>('[data-typewriter]')];
	let pending = typewriters.length;
	const complete = () => {
		if (pending > 0) pending--;
		if (pending === 0 && !typingComplete && !disposed) {
			typingComplete = true;
			for (const refresh of refreshReveals) refresh();
		}
	};
	if (!pending) complete();
	for (const node of typewriters) {
		const text = node.dataset.text ?? node.textContent ?? '';
		const visible = node.querySelector<HTMLElement>('[data-typewriter-visible]');
		const tail = node.querySelector<HTMLElement>('[data-typewriter-tail]');
		const cursor = node.querySelector<HTMLElement>('[data-typewriter-cursor]');
		if (!visible || !tail) {
			complete();
			continue;
		}
		let frame = 0;
		let finished = false;
		const render = (length: number) => {
			visible.textContent = text.slice(0, length);
			tail.textContent = text.slice(length);
		};
		const finish = () => {
			cancelAnimationFrame(frame);
			render(text.length);
			if (cursor) cursor.hidden = true;
			if (!finished) {
				finished = true;
				complete();
			}
		};
		if (skipEntrances || reduced.matches || window.scrollY >= window.innerHeight || !text.length)
			finish();
		else {
			render(0);
			if (cursor) cursor.hidden = false;
			const start = performance.now() + 300;
			const tick = (now: number) => {
				if (disposed) return;
				const length = Math.min(text.length, Math.max(0, Math.floor((now - start) / 35)));
				render(length);
				if (length === text.length) finish();
				else frame = requestAnimationFrame(tick);
			};
			frame = requestAnimationFrame(tick);
		}
		motionUpdates.push(() => {
			if (reduced.matches) finish();
		});
		cleanups.push(finish);
	}

	const navName = root.querySelector<HTMLElement>('[data-nav-name]');
	const heroName = root.querySelector<HTMLElement>('[data-hero-name]');
	if (navName && heroName) {
		if (typeof IntersectionObserver === 'undefined') navName.classList.add('is-visible');
		else {
			const observer = new IntersectionObserver(([entry]) => {
				if (entry) navName.classList.toggle('is-visible', !entry.isIntersecting);
			});
			observer.observe(heroName);
			cleanups.push(() => observer.disconnect());
		}
	}

	for (const link of root.querySelectorAll<HTMLElement>('[data-magnetic]')) {
		const content = link.querySelector<HTMLElement>('[data-magnetic-content]');
		if (!content) continue;
		const reset = () => content.style.removeProperty('translate');
		const move: EventListener = (event) => {
			const pointer = event as PointerEvent;
			if (reduced.matches || !finePointer.matches || pointer.pointerType === 'touch') return;
			const bounds = link.getBoundingClientRect();
			const configured = Number(link.dataset.magnetic || 0.3);
			const intensity = Number.isFinite(configured) ? configured : 0.3;
			content.style.translate = `${(pointer.clientX - bounds.left - bounds.width / 2) * intensity}px ${(pointer.clientY - bounds.top - bounds.height / 2) * intensity}px`;
		};
		listen(link, 'pointermove', move);
		listen(link, 'pointerleave', reset);
		listen(link, 'pointercancel', reset);
		listen(window, 'blur', reset);
		const update = () => {
			if (reduced.matches || !finePointer.matches) reset();
		};
		motionUpdates.push(update);
		pointerUpdates.push(update);
		cleanups.push(reset);
	}
	const updateMotion = () => {
		for (const update of motionUpdates) update();
	};
	listen(reduced, 'change', updateMotion);
	listen(finePointer, 'change', () => {
		for (const update of pointerUpdates) update();
	});
	return () => {
		disposed = true;
		for (const cleanup of cleanups) cleanup();
	};
}

let cleanup: (() => void) | undefined;
function initialize(skipEntrances = false) {
	if (!cleanup) cleanup = enhancePortfolio(document, { skipEntrances });
}
// Astro page transitions and bfcache restores must not duplicate observers/listeners.
if (typeof document !== 'undefined') {
	initialize();
	document.addEventListener('astro:page-load', () => initialize());
	document.addEventListener('astro:before-swap', () => {
		cleanup?.();
		cleanup = undefined;
	});
	window.addEventListener('pagehide', () => {
		cleanup?.();
		cleanup = undefined;
	});
	window.addEventListener('pageshow', (event) => {
		if (event.persisted) initialize(true);
	});
}
