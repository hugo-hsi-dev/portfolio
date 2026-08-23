# Hugo Hsi portfolio

A minimal, single-page developer portfolio built with SvelteKit, Svelte 5, TypeScript,
Tailwind CSS, and the Cloudflare adapter.

## Develop

    pnpm install
    pnpm dev

The local site runs at http://localhost:5173.

## Verify

    pnpm lint
    pnpm check
    pnpm build
    pnpm deploy:dry-run
    pnpm test:e2e

The build command produces the Worker bundle under .svelte-kit/cloudflare. CI also performs a Wrangler deployment dry run against that bundle.

## Deploy

Authenticate Wrangler with your Cloudflare account, then run:

    pnpm deploy

Brand, content, design-system, and motion decisions are documented under `docs/`.
Bundled fonts live under `static/fonts`, and public product evidence lives under
`static/images`.

## Font license

The bundled Recursive font retains its SIL Open Font License terms. See
`static/fonts/recursive-OFL.txt`.
