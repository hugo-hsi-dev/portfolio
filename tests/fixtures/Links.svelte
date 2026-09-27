<script lang="ts">
	import Button from '../../src/lib/components/Button.svelte';
	import TextLink from '../../src/lib/components/TextLink.svelte';
	import MagneticLink from '../../src/lib/components/MagneticLink.svelte';
</script>

<Button href="/resume.pdf" download="resume.pdf" aria-label="Download fixture" variant="outline"
	>Download</Button
>
<TextLink href="https://example.com" target="_blank" rel="noreferrer" arrow>Visit</TextLink>
<MagneticLink
	href="#top"
	aria-label="Magnetic fixture"
	intensity={0.2}
	class={['fixture-magnetic', { 'fixture-active': true }]}>Top</MagneticLink
>
