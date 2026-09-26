<script lang="ts">
	import { reveal } from '$lib/actions/reveal';
	import { technologies } from '$lib/data/portfolio';
</script>

<section class="py-24 pr-6 pl-8 lg:px-12 lg:py-32" aria-labelledby="tech-title">
	<div class="mx-auto w-full max-w-6xl">
		<header
			use:reveal
			class="mb-16 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-4 max-[420px]:gap-3"
		>
			<h2
				id="tech-title"
				class="font-serif text-4xl leading-[1.1] font-normal tracking-tight lg:text-5xl"
			>
				Technical Skills
			</h2>
		</header>
		<div use:reveal class="grid grid-cols-2 gap-8 md:grid-cols-3 lg:gap-12">
			{#each technologies as group (group.label)}
				<div>
					<h3 class="mb-4 font-sans text-xs font-normal tracking-[0.2em] text-stone uppercase">
						{group.label}
					</h3>
					<ul class="m-0 grid list-none gap-2 p-0 text-base">
						{#each group.items as item (item)}<li>{item}</li>{/each}
					</ul>
				</div>
			{/each}
		</div>
	</div>
</section>
