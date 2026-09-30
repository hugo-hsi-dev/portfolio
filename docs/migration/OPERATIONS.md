# Local and cloud migration operations

Use Node 24 and pnpm 11.22.0 on both machines. The package manager is pinned and
bootstrap requires the committed lockfile. Node patch equality is not enforced:
the saved cloud toolchain is 24.19.0; earlier workstation checks used 24.21.0.
Choose a reviewed commit SHA and create a separate checkout; do not switch a dirty
legacy checkout or transfer its env files, node_modules or local CMS state.

## Saved cloud environment: proposed setup

The saved environment is still configured for the legacy root app. The following
is a recipe for a future parent/user setup action, not evidence that settings have
been changed. The existing `/workspace/.cloud-setup/activate.sh` stays unchanged.

After checkout, use this setup body from the repository root:

```sh
set -eu
source /workspace/.cloud-setup/activate.sh
node --version
test "$(pnpm --version)" = 11.22.0
git rev-parse HEAD
pnpm migration:bootstrap
```

Verify the printed SHA against the chosen integration revision. On a workstation,
activate matching Node/pnpm with its own version manager instead of sourcing the
cloud-only file. Then both environments run the same scripts:

```sh
pnpm migration:check
pnpm migration:build
pnpm migration:smoke
pnpm lint
pnpm check
pnpm test
pnpm deploy:dry-run
```

The legacy dry-run builds the root application and performs no deployment.
The migration smoke requires a prior build, rejects named cloud targets and
copies only local Wrangler config, the compiled `dist` directory and an installed
module symlink to temporary storage. It excludes env files and local database
state, validates source and built binding config, and runs Wrangler's built Worker
locally. The built smoke is independent of Astro's dev background lifecycle.

Add separate migration Check, Build, Smoke and Start actions when updating the
saved environment through its UI. Preserve legacy actions until cutover. Use this
supervised start action and the URL reported by Portless:

```sh
CLOUDFLARE_CF_FETCH_ENABLED=false ASTRO_DEV_BACKGROUND=1 pnpm migration:dev
```

The overrides apply only to that command. The first avoids optional Request.cf
metadata fetching; the second keeps Astro 7 inside the supervised Portless
process instead of auto-backgrounding in an agent environment. Stop the managed
process afterward. No saved global background flags are required.

## Generated files and validation

EmDash regenerates `apps/astro-emdash/emdash-env.d.ts` from the local database on
dev startup. Git and Prettier ignore this exact generated path; keep the tsconfig
include so regenerated collection types remain available to the editor. Do not
hand-format, commit or copy it between tasks. Reviewed schema changes belong in
the schema seed and policy/model code. `.astro`, `.emdash`, `dist`, `.wrangler`
and local environment files are also excluded from version control.

`.github/workflows/migration-validation.yml` checks PR heads targeting integration
and integration pushes, using Node 24, pnpm 11.22.0, frozen bootstrap, migration
check/build/disposable smoke, UI interaction and published-CMS browser tests, and
legacy lint/check/tests/deployment dry-run. Browser tooling is pinned to Python
3.12, Playwright 1.62.0 and Pillow 12.3.0; Chromium and its runner dependencies are
installed explicitly. It
uses pinned actions, `contents:read`, credential-free checkout and no repository
secrets, cloud environments or deployment step. Its final check rejects changed
tracked inputs and unexpected untracked files. It does not configure required
status checks or any repository security setting. The UI harness is invoked without modifications. Authenticated browser admin
verification remains a separate gate owned by its task.

## Environment key and storage mapping

Choose `.dev.vars` or `.env` in `apps/astro-emdash`, never both or mixed variants.
The validator examines filenames, not values. Git ignores `.env`, `.env.*`,
`.dev.vars` and `.dev.vars.*`, except `.dev.vars.example`. A fresh coding task
needs none of these secret files and no Cloudflare credentials.

| Name                                            | Scope and purpose                                                                                                                       |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `EMDASH_SITE_URL`                               | Runtime origin; optional locally, exact stable origin before passkey configuration.                                                     |
| `EMDASH_ENCRYPTION_KEY`                         | Runtime secret supplied and securely backed up by Hugo before encrypted plugin settings.                                                |
| `EMDASH_PREVIEW_SECRET`, `EMDASH_IP_SALT`       | Optional runtime overrides; otherwise EmDash manages values in its database.                                                            |
| `CLOUDFLARE_ENV`                                | Future named target selected during build; current coding commands reject it. Deployment `--env` alone does not select the Astro build. |
| `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` | Future authorized deployment tooling only; absent from coding/tests.                                                                    |
| `DB`                                            | Local D1: EmDash schema/content and database-managed settings.                                                                          |
| `MEDIA`                                         | Local R2: CMS upload bytes, distinct from static images/fonts/PDF assets.                                                               |
| `SESSION`                                       | Local KV: Astro sessions. Local KV round trips do not prove login/session behavior.                                                     |
| `ASSETS`                                        | Generated static binding for this application's build, separate from legacy ASSETS.                                                     |

There is no generic `AUTH_SECRET`. Coding bindings use local dummy IDs and
`remote:false`, disabled public URLs and no routes. Development storage persists
in app-local `.wrangler/state`; smoke storage lives in a disposable temporary
directory. Tests never reuse development state or transfer it between tasks.

Future Worker runtime variables/secrets and resource bindings must be configured
separately from Workers Builds variables/secrets. Build-time settings are not
inherited by the deployed Worker automatically. Only after separate authorization:
review private-preview access and isolated resources, securely configure runtime
origin/secrets, select the reviewed target at build time, inspect generated config
and publish through its approved deployment procedure. No named target or remote
setup commands are provided while that configuration is absent.

Production resources, domain routing, main writes, persistent import and credential
setup require their own approval. Existing public legacy branch previews remain
the previously approved root-app builds. This workflow does not deploy EmDash.

References: [Cloudflare environment loading](https://developers.cloudflare.com/workers/local-development/environment-variables/),
[Astro target selection](https://docs.astro.build/en/guides/integrations-guide/cloudflare/),
[Cloudflare Vite persistence](https://developers.cloudflare.com/workers/vite-plugin/reference/api/).
