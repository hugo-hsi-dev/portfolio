<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<main>
	<section>
		<p>{data.site.metadata.hero.firstName} {data.site.metadata.hero.lastName}</p>
		<h1>{data.site.metadata.hero.tagline}</h1>
		<p>{data.site.metadata.hero.intro}</p>
	</section>

	<section id="projects">
		<h2>Selected Work</h2>
		<ul>
			{#each data.projects as project (project.slug)}
				<li>
					<h3>{project.metadata.title}</h3>
					<p>{project.metadata.excerpt}</p>
				</li>
			{/each}
		</ul>
	</section>

	<section>
		<h2>Tech Stack</h2>
		{#each Object.entries(data.technologies.metadata) as [category, technologies] (category)}
			<h3>{category}</h3>
			<p>{technologies.join(', ')}</p>
		{/each}
	</section>
</main>
