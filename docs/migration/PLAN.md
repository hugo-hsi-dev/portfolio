# Astro + EmDash migration

## Baseline and branch contract

Verified GitHub `main` on 2026-09-30: `326c112c709f93bba6fb4701d03870383a316424`.
The canonical local checkout is `/Users/hugo-hsi/Projects/portfolio`; its uncommitted
`.codex/environments/environment.toml` change is preserved. Migration work uses a separate clone.

`integration/astro-emdash` stages reviewed migration PRs. Foundation branch
`codex/astro-emdash-foundation` and content branch `codex/astro-emdash-content` target it.
The parent task coordinates integration merges. Main and production cutover require Hugo's approval.

Existing SvelteKit remains at the repository root. Root `dev`, `build`, `deploy`,
`deploy:dry-run`, and `preview` retain their existing meaning. The new SSR app lives in
`apps/astro-emdash`; its foundation exposes `/health.json` and EmDash's admin routes.
The public portfolio UI belongs to the later parity slice.

Current content is authored in `src/lib/data/portfolio.ts`, `contact.ts`, and Svelte
components, with SEO in `+page.svelte`, static fonts/project images, and a bundled
résumé PDF plus editable LaTeX. Preserve all five projects, three experience items,
two education items, three skill groups, contact links, biography/headline/quote,
fragment URLs and résumé download compatibility. No WordPress importer applies here.

## Reproduce locally or in a cloud task

Use Node.js 24 and **pnpm 11.22.0**, specified by `packageManager` and engine checks.
Activate the cloud task's matching pnpm before running these commands; do not rely
on its default shell version. Both environments use the same committed lockfile.

```sh
pnpm migration:bootstrap
pnpm migration:check
pnpm migration:build
pnpm migration:smoke
pnpm migration:dev
```

Development uses the URL reported by Portless. The smoke test starts a loopback
preview on port 4387 and stops it afterward. It checks ephemeral D1, R2 and KV,
then the built Worker health route and CMS setup page. It never creates an admin.
Build before smoke. Run legacy checks independently:

```sh
pnpm lint
pnpm check
pnpm test
pnpm build
pnpm deploy:dry-run
```

Generated `.astro`, `.emdash`, `dist`, and `.wrangler` data stay local
and ignored. Do not transfer secret files or emulated CMS state between tasks.

## Tested dependency and runtime contract

| Package                         | Exact version   |
| ------------------------------- | --------------- |
| Astro                           | 7.3.5           |
| EmDash / @emdash-cms/cloudflare | 1.0.1 / 1.0.1   |
| @astrojs/cloudflare             | 14.3.3          |
| @astrojs/react                  | 7.0.0           |
| React / React DOM               | 19.3.0 / 19.3.0 |
| Wrangler (migration app)        | 4.144.0         |
| TypeScript / @astrojs/check     | 6.0.3 / 0.9.10  |
| @cloudflare/workers-types       | 5.20260930.1    |
| oxc-transform-react             | 0.145.0         |

The adapter requires Astro `^7.2.0` and Wrangler `^4.125.0`; React integration
requires `oxc-transform-react ^0.145.0`; Astro check requires TypeScript 5 or 6.
The committed lockfile records the resolved peer graph. Latest TypeScript 7 is
deliberately excluded. Legacy root package versions remain those in the baseline
lockfile; shared peer contexts and the Astro formatter are added.

The install records release-age exceptions for the explicit Workers types,
Wrangler and its `miniflare@5.20260926.1-alpha` dependency. These exact versions
passed the pnpm supply-chain policy check; retain them until a reviewed update.

Cloudflare Workers is the target, with React for the admin UI. Keep the official
Worker handler, `PluginBridge` export and matching maintenance cron. The generic
live collection is `_emdash`; the content task owns collection models/importing.
Images use passthrough initially, so no billed `IMAGES` binding is required.
Sandboxed plugins, `LOADER`, email, AI and caching are outside the foundation.

## Environment and storage contract

The committed `wrangler.jsonc` is local-only: separate Worker name, no routes,
disabled workers.dev/preview URLs, dummy D1/KV IDs, and `remote: false` resources.
`DB` emulates D1, `MEDIA` emulates R2 and `SESSION` emulates adapter session KV.
All three are isolated from legacy `ASSETS`; none require Cloudflare credentials.
The adapter adds the built app's own `ASSETS` binding in its generated config.

Use `.dev.vars` **or** `.env` in the app directory, never both. The committed
`.dev.vars.example` contains names/comments only; bootstrap does not create it.
The migration validation reads filenames/config, never secret file values.

| Key                                             | Requirement / secure setup                                                                                                                      |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `EMDASH_SITE_URL`                               | Optional locally (defaults to request origin); set the exact Portless/preview/production origin per environment before configuring passkeys.    |
| `EMDASH_ENCRYPTION_KEY`                         | Required before encrypted plugin settings are saved. Hugo supplies and backs it up securely later; do not generate or copy it during migration. |
| `EMDASH_PREVIEW_SECRET`, `EMDASH_IP_SALT`       | Optional runtime overrides; normally generated/stored by EmDash in the database.                                                                |
| `CLOUDFLARE_ENV`                                | Future named cloud target selected **at build time**. Current foundation commands reject named environments.                                    |
| `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` | Future authorized deployment tooling only; not needed locally and never committed or copied between tasks.                                      |

There is no generic `AUTH_SECRET`. Passkeys are domain-bound; Hugo completes the
first-admin setup later at the intended origin. No credentials are created here.

## PR slices and release gates

- [x] Foundation: coupled Astro/EmDash runtime, shared lockfile/scripts, local storage,
      environment validation and local smoke tests.
- [ ] Content model: deterministic authored-TS fixture, stable identifiers and asset hashes,
      reviewed EmDash 1.x schemas and idempotent importer. Owner: content task.
- [ ] UI parity: preserve design/content, URLs, accessibility, responsive layouts,
      motion and résumé links; compare screenshots and functional behavior.
- [ ] CMS editing: seed only fresh databases, test draft/publish/preview/media/auth,
      use reviewed schema migrations for existing databases.
- [ ] Separate private preview resources/config: DB/MEDIA/SESSION and runtime origin,
      credential setup by Hugo, build-time `CLOUDFLARE_ENV`, no production bindings.
- [ ] Cloud checks and recovery: replay the same scripts, backup/restore rehearsal,
      migration rollback plan and no secret/state transfers.
- [ ] Main cutover: 90–100% ready, passing independent review/checks and parity,
      functional CMS, isolated preview, recovery evidence and Hugo's approval.

Dashboard audit verified legacy Workers Builds: root `/`, build `pnpm run build`,
production branch `main` with `npx wrangler deploy`, other branches with
`npx wrangler versions upload`, all-branch/file watching and public legacy previews.
Hugo approved migration branch pushes and those existing preview builds. They
continue serving the legacy root app; this does not authorize EmDash deployment,
cloud resource provisioning, main writes or production cutover. The existing
build token has broad privileges; do not expose or reuse it for migration setup.

## Official references

- [EmDash Cloudflare deployment](https://docs.emdashcms.com/deployment/cloudflare/)
- [Current official starter](https://github.com/emdash-cms/emdash/tree/main/templates/starter-cloudflare)
- [EmDash releases](https://github.com/emdash-cms/emdash/releases)
- [Astro Cloudflare integration](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)
- [EmDash secrets](https://docs.emdashcms.com/deployment/secrets/)
- [Core migrations](https://docs.emdashcms.com/deployment/core-migrations/)
- [Schema evolution](https://docs.emdashcms.com/deployment/schema-evolution/)

Current 1.x docs take precedence over indexed beta-era templates and examples.
Astro's adapter selects Workers, and named target selection must happen while
building rather than relying only on `wrangler deploy --env` afterward.

## Foundation validation evidence — 2026-09-30

Local Node 24.21.0 / pnpm 11.22.0:

- Frozen-lockfile bootstrap passed with pnpm's supply-chain checks.
- `pnpm lint` passed for the whole repository.
- `pnpm migration:check`: all 21 combined foundation/content tests passed with
  zero skips after rebasing onto content PR #128 (`568c0ae`), including the real
  EmDash 1.0.1 disposable SQLite import and repeated zero-write rehearsal;
  Astro reported zero errors, warnings or hints.
- `pnpm migration:build` passed and generated the isolated Worker configuration.
- `pnpm migration:smoke`: ephemeral D1 query, R2 write/read and SESSION KV
  write/read passed; built health and EmDash setup pages returned 200.
- Legacy `pnpm check` reported zero diagnostics; all 12 `pnpm test` tests passed;
  root build and deployment dry run passed with only the legacy ASSETS binding.
- Independent read-only agent review found a missing dev-command validation guard;
  root and direct app development were corrected and reviewed again, with no
  remaining concrete defects. Named cloud-target rejection was also verified.

The CMS admin bundle emits Vite's large-chunk advisory. Functional editor workflows,
public-page UI parity, cloud replay and a private CMS preview remain later gates.
