<script lang="ts">
	import { magnetic } from '$lib/actions/magnetic';
	import { reveal } from '$lib/actions/reveal';
</script>

<footer
	id="contact"
	class="flex min-h-[110dvh] flex-col justify-end bg-charcoal py-16 pr-6 pb-12 pl-8 text-cream lg:block lg:min-h-auto lg:px-12 lg:py-24 xl:py-32"
>
	<div class="mx-auto w-full max-w-6xl">
		<div use:reveal class="mb-16 grid grid-cols-1 gap-16 lg:grid-cols-2">
			<div>
				<h2 class="mb-6 font-serif text-4xl leading-[1.1] tracking-tight lg:text-6xl">
					Let’s work together
				</h2>
				<p class="max-w-md text-lg leading-normal text-stone-light">
					Full-stack development, thoughtful design, and hands-on production experience. Based in
					Brooklyn, New York.
				</p>
			</div>
			<div class="lg:flex lg:flex-col lg:items-end lg:justify-end lg:text-right">
				<a
					use:magnetic={0.15}
					href="mailto:hugohsidev@gmail.com"
					class="mb-4 inline-flex items-center gap-3 text-xl leading-normal wrap-anywhere transition-colors duration-200 hover:text-gold motion-reduce:transition-none max-[420px]:text-lg lg:text-2xl"
				>
					<span
						data-magnetic-content
						class="inline-flex items-center gap-3 transition-[translate] duration-300 ease-out motion-reduce:transition-none"
					>
						<svg
							class="size-6 shrink-0"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							aria-hidden="true"
							><rect x="3" y="5" width="18" height="14" rx="1" /><path d="m3 6 9 7 9-7" /></svg
						>hugohsidev@gmail.com
					</span>
				</a>
				<div class="flex items-center gap-6 text-sm text-stone-light">
					{#each [{ label: 'Email', url: 'mailto:hugohsidev@gmail.com' }, { label: 'GitHub', url: 'https://github.com/hugo-hsi-dev' }, { label: 'LinkedIn', url: 'https://www.linkedin.com/in/hugo-hsi' }] as link (link.label)}
						<!-- eslint-disable svelte/no-navigation-without-resolve -- These are external contact destinations. -->
						<a
							href={link.url}
							class="group inline-flex min-h-11 items-center gap-1.5 text-sm leading-normal text-stone transition-colors duration-200 hover:text-cream motion-reduce:transition-none"
							><span
								class="relative after:absolute after:inset-x-0 after:-bottom-[3px] after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-300 after:ease-reveal group-hover:after:scale-x-100 group-focus-visible:after:scale-x-100 motion-reduce:after:transition-none"
								>{link.label}</span
							></a
						>
						<!-- eslint-enable svelte/no-navigation-without-resolve -->
					{/each}
				</div>
			</div>
		</div>
		<div
			use:reveal
			class="flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-center text-xs leading-normal text-stone md:flex-row md:text-left"
		>
			<span>© {new Date().getFullYear()} Hugo Hsi. All rights reserved.</span><span
				>Built with SvelteKit, Cloudflare, and attention to detail.</span
			>
		</div>
	</div>
</footer>
