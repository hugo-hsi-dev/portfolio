<script lang="ts">
	import {
		buildStructuredDataJson,
		socialImageUrl,
		type PortfolioContent
	} from '$lib/features/portfolio-content';

	let {
		site,
		projects,
		technologies
	}: {
		site: PortfolioContent['site'];
		projects: PortfolioContent['projects'];
		technologies: PortfolioContent['technologies'];
	} = $props();

	let imageUrl = $derived(socialImageUrl(site));
</script>

<svelte:head>
	<title>{site.metadata.seo.title}</title>
	<meta name="description" content={site.metadata.seo.description} />
	<meta name="author" content={`${site.metadata.hero.firstName} ${site.metadata.hero.lastName}`} />
	<meta name="keywords" content={site.metadata.seo.keywords.join(', ')} />
	<meta name="robots" content="index, follow, max-image-preview:large" />
	<meta name="theme-color" content={site.metadata.seo.themeColor} />
	<link rel="canonical" href={site.metadata.seo.canonicalUrl} />
	<meta property="og:type" content="website" />
	<meta property="og:locale" content="en_US" />
	<meta property="og:site_name" content="Hugo Hsi Portfolio" />
	<meta property="og:title" content={site.metadata.seo.title} />
	<meta property="og:description" content={site.metadata.seo.description} />
	<meta property="og:url" content={site.metadata.seo.canonicalUrl} />
	<meta property="og:image" content={imageUrl} />
	<meta property="og:image:alt" content={site.metadata.seo.imageAlt} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={site.metadata.seo.title} />
	<meta name="twitter:description" content={site.metadata.seo.description} />
	<meta name="twitter:image" content={imageUrl} />
	<!-- prettier-ignore -->
	<script type="application/ld+json">
{@html buildStructuredDataJson(site, projects, technologies)}
	</script>
</svelte:head>
