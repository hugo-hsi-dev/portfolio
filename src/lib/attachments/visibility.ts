import type { Attachment } from 'svelte/attachments';

/** Report whether the element intersects the viewport. */
export function visibility(onchange: (visible: boolean) => void): Attachment<Element> {
	return (node) => {
		const observer = new IntersectionObserver(([entry]) => onchange(entry.isIntersecting));
		observer.observe(node);
		return () => observer.disconnect();
	};
}
