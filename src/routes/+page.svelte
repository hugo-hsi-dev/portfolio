<script lang="ts">
	import PortfolioBoard from '$lib/features/portfolio-board/components/PortfolioBoard.svelte';
	import PortfolioSeo from '$lib/features/portfolio-board/components/PortfolioSeo.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<PortfolioSeo
	site={data.content.site}
	projects={data.content.projects}
	technologies={data.content.technologies}
/>
<PortfolioBoard content={data.content} document={data.canvas} />
