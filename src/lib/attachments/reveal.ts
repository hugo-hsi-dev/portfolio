import type { Attachment } from 'svelte/attachments';

/** Pair with `reveal`: hides pending elements and plays the enter animation once revealed. */
export const revealClasses =
	'motion-safe:data-[reveal=pending]:opacity-0 motion-safe:data-[reveal=in]:animate-enter';

let observer: IntersectionObserver | undefined;

function getObserver() {
	observer ??= new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				(entry.target as HTMLElement).dataset.reveal = 'in';
				observer!.unobserve(entry.target);
			}
		},
		{ threshold: 0.1 }
	);
	return observer;
}

/** Flag an element as revealed the first time it scrolls into view. */
export const reveal: Attachment<HTMLElement> = (node) => {
	node.dataset.reveal = 'pending';
	getObserver().observe(node);
	return () => getObserver().unobserve(node);
};
