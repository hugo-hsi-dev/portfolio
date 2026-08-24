# Hugo Hsi portfolio

A hiring-focused, one-page portfolio built with SvelteKit, Svelte 5, TypeScript, Tailwind CSS, and Cloudflare Workers.

## Develop

```sh
pnpm install
pnpm dev
```

The local site runs with [Portless](https://portless.sh). The first run may ask to trust Portless's local
certificate authority and authorize its HTTPS proxy. Linked Git worktrees get a
branch-prefixed URL automatically.

## Verify

```sh
pnpm lint
pnpm check
pnpm build
pnpm deploy:dry-run
```

The dry run validates the generated Worker and static-asset bundle without changing the live deployment.

## Deploy

Authenticate Wrangler with the intended Cloudflare account, then run:

```sh
pnpm deploy
```

Pull requests and pushes to `main` are also validated by GitHub Actions and Cloudflare Workers Builds.

## License

Source code is available under the MIT license. Personal content and branding are excluded. See `LICENSE.md`.
