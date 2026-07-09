<script lang="ts">
	let { title, meta, id }: { title: string; meta?: string; id?: string } = $props();
</script>

<header class="section-header">
	<h2 {id}>{title}</h2>
	{#if meta}
		<p>{meta}</p>
	{/if}
</header>

<style>
	.section-header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1.5rem;
		margin-block-end: 4rem;
	}

	h2 {
		margin: 0;
		font-family: var(--font-serif);
		font-size: 2.75rem;
		font-weight: 400;
		line-height: 1;
	}

	p {
		margin: 0;
		color: var(--color-slate);
		font-size: 0.75rem;
		font-weight: 500;
		text-transform: uppercase;
	}

	@media (min-width: 64rem) {
		h2 {
			font-size: 3.5rem;
		}
	}

	@media (max-width: 30rem) {
		.section-header {
			align-items: flex-start;
			flex-direction: column;
			gap: 0.75rem;
			margin-block-end: 3rem;
		}
	}
</style>
