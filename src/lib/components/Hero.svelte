<script lang="ts">
	import resumeUrl from '../../../resume/hugo-hsi-resume.pdf?url';
	import { reveal } from '$lib/actions/reveal';
	import Typewriter from './Typewriter.svelte';

	let { onNameVisibilityChange }: { onNameVisibilityChange: (visible: boolean) => void } = $props();
	/** Notify the navigation when the hero name enters or leaves the viewport. */
	function observeName(node: HTMLElement) {
		const observer = new IntersectionObserver(([entry]) =>
			onNameVisibilityChange(entry.isIntersecting)
		);
		observer.observe(node);
		return { destroy: () => observer.disconnect() };
	}
	const buttonClass =
		"relative isolate inline-flex min-h-[46px] items-center justify-center gap-2.5 overflow-hidden border border-charcoal px-6 py-3 text-sm leading-5 tracking-[0.05em] uppercase transition-[color,background-color,scale] duration-300 active:scale-[0.98] before:absolute before:inset-0 before:-z-10 before:-translate-x-[101%] before:transition-transform before:duration-400 before:ease-[cubic-bezier(0.25,0.46,0.45,0.94)] before:content-[''] hover:before:translate-x-0 focus-visible:before:translate-x-0 motion-reduce:transition-none motion-reduce:before:transition-none";
</script>

<section
	class="relative flex min-h-svh flex-col justify-center pt-24 pr-6 pb-16 pl-8 before:pointer-events-none before:absolute before:inset-0 before:bg-[url('/grain.svg')] before:opacity-[0.02] before:content-[''] lg:px-12"
	id="top"
	aria-labelledby="hero-title"
>
	<div
		class="relative mx-auto grid w-full max-w-6xl grid-cols-1 items-end gap-12 lg:grid-cols-12 lg:gap-8"
	>
		<div class="lg:col-span-8">
			<p
				class="mb-6 text-sm tracking-[0.2em] text-stone uppercase"
				use:observeName
				use:reveal={{ immediate: true, y: 10, duration: 400 }}
			>
				Hugo Hsi
			</p>
			<h1
				id="hero-title"
				class="mb-8 max-w-2xl font-serif text-4xl leading-[1.1] font-normal md:text-5xl lg:text-6xl"
			>
				<Typewriter text="Engineering products from design to database." />
			</h1>
			<p
				class="mb-10 max-w-lg text-base leading-[1.625] text-pretty text-slate"
				use:reveal={{ immediate: true, delay: 100, y: 0, duration: 500 }}
			>
				Full-stack developer with a background in communication design. I work directly with clients
				to build responsive websites, migrate content systems, and maintain production applications.
			</p>
			<div class="flex flex-wrap gap-4">
				<a
					class={[buttonClass, 'bg-charcoal text-cream before:bg-border']}
					href="#projects"
					use:reveal={{ immediate: true, delay: 220, y: 10, duration: 350 }}
					><span>View my work</span></a
				>
				<!-- eslint-disable svelte/no-navigation-without-resolve -- Vite resolves the imported PDF asset URL. -->
				<a
					class={[
						buttonClass,
						'bg-transparent text-charcoal before:bg-charcoal hover:text-cream focus-visible:text-cream'
					]}
					href={resumeUrl}
					download="Hugo-Hsi-Resume.pdf"
					use:reveal={{ immediate: true, delay: 370, y: 10, duration: 350 }}
					><span>Download resume</span></a
				>
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
			</div>
		</div>
		<aside
			class="max-w-[22rem] font-serif text-sm leading-[1.625] text-pretty text-stone italic lg:col-span-4 lg:ml-auto lg:text-right"
			use:reveal={{ immediate: true, delay: 520, x: 20, y: 0, duration: 450 }}
		>
			<p>
				Beyond the keyboard, I'm a badminton coach, an avid gamer, and an active proponent of taking
				a proper break to do absolutely nothing. <span class="text-gold" aria-hidden="true">”</span>
			</p>
			<span class="mt-5 block font-sans text-[11px] tracking-[0.2em] uppercase not-italic"
				>Brooklyn, New York</span
			>
		</aside>
	</div>
</section>
