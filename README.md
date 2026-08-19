# Hugo Hsi portfolio

A focused one-page portfolio built with SvelteKit 3, Svelte 5, TypeScript, Tailwind CSS, and the Cloudflare adapter.

## Develop

    pnpm install
    pnpm dev

The local site runs at http://localhost:5173.

## Verify

    pnpm lint
    pnpm check
    pnpm test:unit
    pnpm build
    pnpm test:e2e

The build command validates generated Cloudflare types and produces the Worker bundle under .svelte-kit/cloudflare.

## Deploy

Authenticate Wrangler with your Cloudflare account, then run:

    pnpm deploy

Project screenshots live under static/media/projects, and the downloadable résumé lives under static/media/resume.

## License

Source code is available under the MIT license. Personal content, media, résumé files, and branding are excluded. Bundled fonts retain their SIL Open Font License terms. See LICENSE.md.
