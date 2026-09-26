<script lang="ts">
	import resumeUrl from '../../../resume/hugo-hsi-resume.pdf?url';
	import { visibility } from '$lib/attachments/visibility';
	import { headline } from '$lib/content';
	import Button from './Button.svelte';
	import Typewriter from './Typewriter.svelte';

	let { onnamevisibilitychange }: { onnamevisibilitychange: (visible: boolean) => void } = $props();
</script>

<section
	id="top"
	class="relative flex min-h-svh flex-col justify-center pt-24 pr-6 pb-16 pl-8 before:pointer-events-none before:absolute before:inset-0 before:bg-[url(/textures/grain.svg)] before:opacity-[0.02] lg:px-12"
	aria-labelledby="hero-title"
>
	<div
		class="relative mx-auto grid w-full max-w-6xl grid-cols-1 items-end gap-12 lg:grid-cols-12 lg:gap-8"
	>
		<div class="lg:col-span-8">
			<p
				class="mb-6 animate-enter text-sm/normal tracking-label text-stone uppercase [--enter-duration:400ms] [--enter-y:10px]"
				{@attach visibility(onnamevisibilitychange)}
			>
				Hugo Hsi
			</p>
			<h1
				id="hero-title"
				class="mb-8 max-w-2xl font-serif text-4xl/[1.1] md:text-5xl/[1.1] lg:text-6xl/[1.1]"
			>
				<Typewriter text={headline} />
			</h1>
			<p
				class="mb-10 max-w-lg animate-enter text-base/relaxed text-pretty text-slate [--enter-delay:100ms] [--enter-duration:500ms] [--enter-y:0]"
			>
				Full-stack developer with a background in communication design. I work directly with clients
				to build responsive websites, migrate content systems, and maintain production applications.
			</p>
			<div class="flex flex-wrap gap-4">
				<Button
					href="#projects"
					class="animate-enter [--enter-delay:220ms] [--enter-duration:350ms] [--enter-y:10px]"
					>View my work</Button
				>
				<Button
					variant="outline"
					href={resumeUrl}
					download="Hugo-Hsi-Resume.pdf"
					class="animate-enter [--enter-delay:370ms] [--enter-duration:350ms] [--enter-y:10px]"
					>Download resume</Button
				>
			</div>
		</div>
		<aside
			class="max-w-88 animate-enter font-serif text-sm/relaxed text-pretty text-stone italic [--enter-delay:520ms] [--enter-duration:450ms] [--enter-x:20px] [--enter-y:0] lg:col-span-4 lg:ml-auto lg:text-right"
		>
			<p>
				Beyond the keyboard, I'm a badminton coach, an avid gamer, and an active proponent of taking
				a proper break to do absolutely nothing.
				<span class="text-gold" aria-hidden="true">”</span>
			</p>
			<span class="mt-5 block font-sans text-[11px] tracking-label uppercase not-italic"
				>Brooklyn, New York</span
			>
		</aside>
	</div>
</section>
