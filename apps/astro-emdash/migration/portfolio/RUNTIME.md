# Portfolio CMS runtime

Pinned and inspected: EmDash 1.0.1, Astro 7.3.5, Cloudflare adapter 14.3.3.
This slice uses the existing local DB/MEDIA/SESSION bindings. It provisions nothing and creates
no administrator, passkey or remote content. The public UI is owned by its separate PR.

## UI interface

```ts
import { loadPortfolio, PortfolioUnavailableError, type Portfolio } from '../lib/server/portfolio';

// loadPortfolio(): Promise<Portfolio>
// PortfolioUnavailableError.code: 'uninitialized' | 'invalid' | 'unavailable'
```

The result has the same keys and nesting as `fixture.json`; no CMS metadata is exposed. Optional
project URL/image/fit fields remain optional. Local image references resolve to ready CMS media
and retain usage-specific alt text. All 17 initial records must be published. Missing required
records produce `uninitialized`; malformed values produce `invalid`; query/driver failures produce
`unavailable`. All use the generic message `Portfolio is temporarily unavailable.` Render a generic
503 with no internal error details and no fixture fallback. Do not cache a module-level snapshot.

`getEmDashCollection` is called with explicit published status, English locale and stored position
ordering for all six collections, including the singleton. Pending draft revisions are excluded.
The adapter deliberately avoids `getEmDashEntry`, which can substitute a preview revision.
Only application-owned anchors, presentation, fixed resource policy and interface labels live in
`src/lib/server/portfolio-application.json`. Authored copy is loaded from CMS records. Name edits
update hero/site/navigation/copyright together; footer/section heading share one CMS field.

## Setup and import

`package.json#emdash.seed` references the schema-only seed. The native content policy is registered
through a runtime plugin descriptor, not a serialized callback. `fonts:false` disables optional
admin Google-font metadata downloads so CMS builds work in the cloud network environment; public
font choices remain unchanged.

`import-drafts.ts` exposes `planPortfolioDrafts(db)` and `importPortfolioDrafts(db)` solely to the
disposable test harness. There is no real app import/publication endpoint or CLI target option.
It validates existing schema and identities, compares exact canonical payloads, then creates only
absent baseline drafts. An unchanged rerun writes nothing. Manual edits, published rows, pending
revisions, extra identities and schema drift stop the operation before content writes. Interrupted
content imports resume missing IDs. This is a single-writer rehearsal: D1 does not provide a
transaction spanning the complete schema/content seed. It is not a concurrent production importer.

## Safeguards and limits

Native fail-closed hooks protect known identities/positions, required data, URL protocols, contact
consistency and media references on save/publication. Managed records cannot be API-created or
deleted. Middleware closes verified REST duplicate/permanent-delete and metadata/schema-write
bypasses in EmDash 1.0.1. Unpublish remains explicit and causes the required-content 503.

These are application safeguards, not database constraints. Trusted seed/repository code and
privileged plugins can bypass hooks. Do not enable unreviewed plugins or run this importer against
a live editor database. No credential-bearing admin browser workflow is claimed by these tests.
Metadata-only direct runtime writes are outside the REST middleware boundary.

EmDash 1.0.1 heuristically JSON-decodes plain text starting with `{` or `[`. Publication rejects
valid JSON-shaped plain text with an explanatory validation error rather than changing its bytes.
The public mapper also rejects already-decoded nonstring text. Normal prose remains unchanged.
Re-audit this workaround and route guards on any EmDash version upgrade.

## Checks

```sh
pnpm migration:bootstrap
pnpm migration:check
pnpm migration:build
pnpm migration:smoke
```

The standard migration check includes `portfolio-d1.test.mjs`. It starts actual Astro/Cloudflare
Vite/workerd with a copied app and ephemeral D1/R2/KV, a random-token loopback test route, no
credential environment and no administrator. It proves draft import/no-op rerun, exact published
fixture parity, pending edits staying private, publication, policy denials, conflict preservation,
local media deduplication/byte retrieval, unpublish failure and cleanup. The injected test route
exists only in the temporary copy; it is absent from the real application build.

Official references: [querying content](https://docs.emdashcms.com/guides/querying-content/),
[seed files](https://docs.emdashcms.com/themes/seed-files/), and
[Cloudflare deployment](https://docs.emdashcms.com/deployment/cloudflare/).
Exact hooks, runtime lifecycle, media normalization and route behavior were additionally verified
against the installed 1.0.1 package source, then exercised with the actual local runtime.
