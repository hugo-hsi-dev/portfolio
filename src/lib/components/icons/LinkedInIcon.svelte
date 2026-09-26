<script lang="ts">
	let { class: className = 'size-5' }: { class?: string } = $props();
</script>

<svg
	class={className}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="1.5"
	aria-hidden="true"
	><rect x="3" y="3" width="18" height="18" rx="1" /><path
		d="M7 10v7m0-10v.1M11 17v-7m0 3a3 3 0 0 1 6 0v4"
	/></svg
>
