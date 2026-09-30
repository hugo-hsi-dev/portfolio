# EmDash 1.0.1 schema and disposable local seed

The fixture remains the UI contract. `schema.seed.json` is an actual EmDash SeedFile with format
`version: "1"`, six non-routable collections and no content. `createDraftSeed()` in `seed.mjs`
returns that schema plus 17 deterministic, explicitly draft, slugless entries. Repeater values use
ordered `{value: string}` rows. The fixture retains simple `string[]` values; the runtime adapter
must convert between these shapes.

The app's `package.json#emdash.seed` selects `migration/portfolio/schema.seed.json` for
schema-only setup. Generated draft content is not an automatic startup migration.
Schema setup creates no administrator or published portfolio content. The public runtime
requires deliberate publication of all required records and fails closed without fixture
fallback; see [RUNTIME.md](./RUNTIME.md) for the current loader and local D1 coverage.

## Exact APIs verified

Read the published `emdash@1.0.1` package, not an invented SDK. The package exports and a real SQLite
run verified:

- `emdash/seed`: `validateSeed(seed)` returns `{valid, errors, warnings}`;
  `applySeed(db, seed, {includeContent: true, onConflict: 'skip'})` applies the reviewed seed.
- `emdash/db`: `runMigrations(db)` prepares the core schema.
- `emdash/db/sqlite`: `createDialect({url: ':memory:'})` uses Node's SQLite driver.
- `kysely`: `new Kysely({dialect})` owns the disposable connection. The harness resolves this from
  EmDash's installed dependencies rather than adding a root dependency.
- In `src/seed/apply.ts`, slugless entries match by ID, and creation passes `entry.id` into the
  content repository. Slugged records instead match collection/locale/slug. All portfolio
  collections use `routable: false`, all entries use `slug: null`, and `entry.id === external_id`.
- `SeedField` supports `required`, `unique`, `indexed`, `translatable` and `validation`.
  `repeater` uses `validation.subFields`; image values accept `id`, `provider`, `src` and `alt`.

Sources: [published package metadata](https://registry.npmjs.org/emdash/1.0.1),
[official seed format and programmatic API](https://docs.emdashcms.com/themes/seed-files/).
Package implementation paths examined: `src/seed/{types,validate,apply}.ts`, `src/schema/types.ts`,
`src/schema/zod-generator.ts`, `src/db/sqlite.ts`, and `src/database/repositories/content.ts`.

## Stored fields and mapping

Every collection has required `external_id` (string, unique/indexed, non-translatable) and
`position` (integer, minimum zero, indexed, non-translatable). Application policy owns these fields;
the seed field API does not by itself prove they are read-only in admin or enforce singleton
cardinality. Actual identity is the content row's primary key, not a title or mutable position.
The local planner detects a different row using the same external ID before attempting writes.

| Collection               | Additional fields                                                                                                                                                                                                                                                                                                           |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `portfolio_home`         | Required strings `name`, `headline`, `location`, `primary_action_label`, `resume_action_label`, `projects_heading`, `experience_heading`, `education_heading`, `skills_heading`, `footer_heading`, `seo_title`, `og_title`; required text `description`, `aside`, `footer_description`, `seo_description`, `og_description` |
| `portfolio_projects`     | Required strings `title`, `category`; required text `description`; required `technologies` repeater of required string `value`, minimum one row; optional `url` and `image`                                                                                                                                                 |
| `portfolio_experience`   | Required strings `date`, `role`, `company`                                                                                                                                                                                                                                                                                  |
| `portfolio_education`    | Required strings `date`, `role`, `company`                                                                                                                                                                                                                                                                                  |
| `portfolio_skill_groups` | Required string `label`; required `items` repeater of required string `value`, minimum one row                                                                                                                                                                                                                              |
| `portfolio_contacts`     | Required string `label`, required `url`, optional string `address`                                                                                                                                                                                                                                                          |

All six enable drafts and revisions. None adds public detail routes, comments or a generic page
builder. Home is logically one record, `portfolio-v1:home`. Presentation fields (accents, fits,
anchors, heading IDs, font preloads, résumé resolution, copyright and credit) stay in the fixture
and application code. Map the home name to hero/site/nav consistently, footer heading to contact
section title, and the four section headings to their existing sections. CMS dates remain display
strings. No canonical-host decision is embedded in editable fields.

## Media

The three project image fields use the supported external-provider shape with existing
site-relative `src`, manifest-derived `id` and exact `alt`. They refer to static assets the UI owner
must preserve; they do **not** claim to be uploaded media rows. No `$media`, downloads, storage
adapter, R2 binding or paid image transform runs. The legacy `fit` remains application-owned.
Favicon, fonts, licenses and résumé keep the manifest's static/bundled/source-only policy.
CMS-managed upload/replacement and image picker behavior require a later media integration test;
this rehearsal verifies persistence of the current URLs and alt text only.

## Local safeguards and command

The sole runner mode creates a new in-memory SQLite database; no database URL/path option exists.
It checks the installed EmDash version, blocks `fetch` during the sandbox lifetime, forbids seed
`$media`/`$ref`, accepts only the reviewed schema, requires draft/slugless records and rejects
unknown image paths. It neither reads Wrangler configuration nor uses credentials or bindings.
The connection is destroyed and `fetch` restored in `finally`. Core migrations run only in that
new memory database. This is a rehearsal, not an importer for an existing site.

```sh
pnpm exec node apps/astro-emdash/migration/portfolio/local-seed.mjs \
  --disposable-local-only /absolute/path/to/installed/astro-app

PORTFOLIO_EMDASH_PACKAGE_ROOT=/absolute/path/to/installed/astro-app \
  pnpm exec node --test apps/astro-emdash/migration/portfolio/*.test.mjs
```

`PORTFOLIO_EMDASH_PACKAGE_ROOT` selects installed code only, never a data target. The tests default
to `apps/astro-emdash` when unset. Before foundation dependencies are present, the portable tests
still run and the database suite reports an explicit skip. An explicitly supplied invalid package
root fails rather than silently skipping. No new package scripts are required.

The planner checks existing draft payloads with canonical SHA-256 checksums. Same identity and
payload is a no-op; changed source or manual edits are conflicts. An ID collision, trashed/published
record, pending revision, or schema drift stops the import. The planner completes before any seed
writes, so one conflict also blocks otherwise missing records. A partial import can resume by
creating missing IDs while skipping unchanged rows. Existing records are never updated or deleted.

## Verification and remaining gates

Verified against EmDash 1.0.1 in a separate temporary dependency directory, installed with package
lifecycle scripts disabled. First run: six collections, 46 fields, 17 draft records, zero media rows.
Second run: 17 no-ops, zero writes, unchanged row versions/timestamps. Tests cover read-only plans,
exact data parity, conflicting source/manual edits, missing-record recovery, duplicate IDs,
publication/remote-media rejection, identity collisions and stored-schema drift.

The harness uses version-pinned raw `ec_*` reads for local preflight and verification. It is not a
production query adapter or a promise of stable database internals. The CMS slice now exercises core setup, D1 execution, publication, native write-policy
hooks and media bytes in actual disposable workerd tests. Its `loadPortfolio()` uses
published EmDash collection reads, not this SQL inspection harness. Concurrency,
persistent import ledgers, browser draft preview and authenticated editor behavior
remain separate gates before adapting the importer to a persistent target. Do not
infer a transaction across the complete import from the SQLite or D1 rehearsals.

Application-owned field protection, the home singleton, URL protocols, email/mailto
agreement and published-only reads are enforced and tested by the CMS slice.
Authenticated media picker/editing, passkeys, session behavior, persistent setup and
backup/restore still require separate verification; direct handler tests do not
establish those browser workflows.
