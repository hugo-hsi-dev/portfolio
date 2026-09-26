<script lang="ts">
	import { reveal, revealClasses } from '$lib/attachments/reveal';
	import { links } from '$lib/content';
	import MagneticLink from './MagneticLink.svelte';
	import TextLink from './TextLink.svelte';
	import MailIcon from './icons/MailIcon.svelte';

	const socialClass = 'min-h-11 text-stone transition-colors duration-200 hover:text-cream';
</script>

<footer
	id="contact"
	class="flex min-h-[110dvh] flex-col justify-end bg-charcoal pt-16 pr-6 pb-12 pl-8 text-cream lg:block lg:min-h-auto lg:px-12 lg:py-24 xl:py-32"
>
	<div class="mx-auto w-full max-w-6xl">
		<div class={['mb-16 grid grid-cols-1 gap-16 lg:grid-cols-2', revealClasses]} {@attach reveal}>
			<div>
				<h2 class="mb-6 font-serif text-4xl/[1.1] tracking-tight lg:text-6xl/[1.1]">
					Let’s work together
				</h2>
				<p class="max-w-md text-lg/normal text-stone-light">
					Full-stack development, thoughtful design, and hands-on production experience. Based in
					Brooklyn, New York.
				</p>
			</div>
			<div class="lg:flex lg:flex-col lg:items-end lg:justify-end lg:text-right">
				<MagneticLink
					intensity={0.15}
					href={links.email}
					class="mb-4 inline-flex items-center text-xl/normal wrap-anywhere transition-colors duration-200 hover:text-gold max-[420px]:text-lg/normal lg:text-2xl/normal"
					><MailIcon class="size-6 flex-none" />{links.emailAddress}</MagneticLink
				>
				<div class="flex items-center gap-6 text-sm">
					<TextLink href={links.email} label="Email" class={socialClass} />
					<TextLink href={links.github} label="GitHub" class={socialClass} />
					<TextLink href={links.linkedin} label="LinkedIn" class={socialClass} />
				</div>
			</div>
		</div>
		<div
			class={[
				'flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-center text-xs/normal text-stone md:flex-row md:text-left',
				revealClasses
			]}
			{@attach reveal}
		>
			<span>© {new Date().getFullYear()} Hugo Hsi. All rights reserved.</span><span
				>Built with SvelteKit, Cloudflare, and attention to detail.</span
			>
		</div>
	</div>
</footer>
