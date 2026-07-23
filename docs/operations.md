# Operate the portfolio on Cloudflare

This runbook explains how to configure, deploy, verify, observe, and roll back the portfolio’s two Cloudflare Workers. It targets maintainers with access to the `portfolio` and `portfolio-realtime` Workers.

## Configure local Worker variables

Local development reads one root `.dev.vars` file. Copy the tracked example:

```sh
cp .dev.vars.example .dev.vars
```

Set one reset token and retain the example’s local origins:

```dotenv
BOARD_RESET_TOKEN=replace_with_at_least_32_random_characters
ALLOWED_ORIGINS=http://127.0.0.1:5173,http://localhost:5173,http://127.0.0.1:4173,http://localhost:4173
```

Generate a suitable token with `openssl rand -hex 32`. The development preflight rejects missing, placeholder, or short tokens before it starts either process.

Run the full local stack:

```sh
pnpm dev
```

The SvelteKit server runs on port `5173`. The realtime Worker runs on port `8788`.

## Authenticate with Cloudflare

Authenticate Wrangler and confirm the active account:

```sh
pnpm exec wrangler login
pnpm exec wrangler whoami
```

Automation may use a scoped Cloudflare application programming interface (API) token instead. Never commit the token or a populated `.dev.vars` file.

## Configure production variables and secrets

The realtime Worker’s `ALLOWED_ORIGINS` variable must contain only these production origins:

```text
https://www.hugohsi.dev,https://hugohsi.dev
```

Create one random reset token, then store the same value on both Workers:

```sh
pnpm exec wrangler secret put BOARD_RESET_TOKEN \
  -c workers/realtime/wrangler.jsonc
pnpm exec wrangler secret put BOARD_RESET_TOKEN \
  -c wrangler.jsonc
```

Wrangler prompts for the secret without writing it to shell history. A mismatched token prevents the SvelteKit reset endpoint from authorizing the Durable Object reset.

## Deploy both Workers

Run all validation before you deploy:

```sh
pnpm install --frozen-lockfile
pnpm verify
pnpm build:all
```

Deploy the realtime Worker first so the service binding always resolves to a compatible target:

```sh
pnpm exec wrangler deploy -c workers/realtime/wrangler.jsonc
pnpm exec wrangler deploy -c wrangler.jsonc
```

The root Worker serves the prerendered SvelteKit application and forwards realtime requests through the `PORTFOLIO_ROOMS` service binding. The realtime Worker owns the SQLite Durable Object class.

## Verify a production deployment

Check these behaviors after both deployments complete:

1. Open `https://www.hugohsi.dev` and confirm all portfolio frames render
2. Open a second browser window and confirm cursor and frame movement synchronize
3. Reload both windows and confirm persisted frame positions remain
4. Open Browse mode and use the Layers panel with a keyboard
5. Run the owner reset and confirm both windows receive the reset state
6. Inspect both Worker log streams for new errors

List the active and recent deployments:

```sh
pnpm exec wrangler deployments status -c wrangler.jsonc
pnpm exec wrangler deployments status \
  -c workers/realtime/wrangler.jsonc
```

## Inspect logs and traces

Both Workers emit structured logs without reset tokens or personal data. The application Worker samples traces, and the realtime Worker samples Durable Object traces.

Tail each Worker during verification:

```sh
pnpm exec wrangler tail -c wrangler.jsonc
pnpm exec wrangler tail -c workers/realtime/wrangler.jsonc
```

Use the Cloudflare dashboard to inspect retained logs, sampled traces, error rates, and Durable Object activity. Compare timestamps across both Workers when a service-binding request fails.

## Roll back a deployment

List recent versions before choosing a rollback target:

```sh
pnpm exec wrangler deployments list -c wrangler.jsonc
pnpm exec wrangler deployments list \
  -c workers/realtime/wrangler.jsonc
```

Roll back in reverse deployment order. Replace each version placeholder with a version identifier from the corresponding deployment list:

```sh
pnpm exec wrangler rollback app_version_id -c wrangler.jsonc
pnpm exec wrangler rollback realtime_version_id \
  -c workers/realtime/wrangler.jsonc
```

Repeat the production verification after rollback. Worker rollback does not revert SQLite data or schema changes. Every future persisted-schema change must therefore include a backward-compatible, transactional migration.

## Troubleshoot local file watching

Use the normal development command first:

```sh
pnpm dev
```

If Wrangler reports `EMFILE` or cannot write its user-level registry or logs, use the constrained fallback:

```sh
pnpm dev:polling
```

The fallback enables polling and redirects Wrangler logs, registry data, cache, and local state under `.wrangler/`. Remove generated state by deleting only the relevant subdirectory after all local Worker processes stop.

If the fallback also fails, confirm Node.js 24 and pnpm 11.11 are active, close stale development processes, and rerun `pnpm install --frozen-lockfile`.
