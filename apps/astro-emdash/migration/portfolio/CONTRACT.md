# Portfolio content migration contract

Status: verified EmDash 1.0.1 schema, published runtime adapter, application safeguards and
disposable D1/R2 lifecycle tests. See `RUNTIME.md` for the exact UI interface and operational limits;
`LOCAL-SEED.md` retains the original SQLite rehearsal. No remote writes or credentials are included.
The source is commit `326c112c709f93bba6fb4701d03870383a316424`.

## Consume the fixture

`fixture.json` is UTF-8 JSON with `schemaVersion: 1`. It has no framework imports or generated
asset dependencies. It is the explicit test/parity reference; public rendering must use `loadPortfolio()`.
`manifest.json` records source hashes, source-to-target mappings, import identities, media byte
hashes, proposed asset destinations and unresolved decisions. Proposed destinations are not files
created by this slice. Do not copy the fixture wholesale to a publicly editable settings object.

| Key                       | Shape and meaning                                                                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `site`                    | `name`, `language`, `route`; route and language remain application configuration                                                                        |
| `hero`                    | `name`, `headline`, `description`, `aside`, `location`, `primaryAction: {label, href}`, `resumeAction: {label, mediaId, download}`                      |
| `sections`                | Ordered `{id, headingId, title}`; null title on hero uses `hero.headline`; null headingId on contact preserves the baseline                             |
| `projects`                | Ordered `{id, title, category, accent, description, technologies, url?, image?: {src, alt, fit?}}`; accent is `gold` or `sage`, fit is absent or `logo` |
| `experience`, `education` | Ordered `{id, date, role, company}`; dates are display text, never parsed/reformatted                                                                   |
| `skillGroups`             | Ordered `{id, label, items: string[]}`; preserve item order and spelling                                                                                |
| `contacts`                | Ordered `{id, label, url, address?}`; address only on email; nav uses the two IDs in `ui.navigation.contactIds`                                         |
| `footer`                  | `heading`, `description`, `copyright`, `credit`; year marker means evaluate the current year at render time                                             |
| `seo`                     | Exact title/description/canonical/OG/theme color and the existing sitemap/robots values                                                                 |
| `ui`                      | Link labels, IDs, accessible-name templates, image presentation, decorative glyphs, font preloads; application-owned semantics                          |

Array order is canonical. Do not alphabetize or infer chronology. IDs are immutable migration keys,
not public route slugs. Preserve absent `image`, `url`, `fit`, and `address` fields; do not manufacture
empty links or image placeholders. Accessible-name templates substitute the exact project title.
Decorative quote and arrow remain aria-hidden; do not append them to editable copy. Headline text
is one semantic string even though the legacy typewriter emits a screen-reader and visual copy.
Text copied from multi-line component markup normalizes HTML-collapsible whitespace to one space;
all visible punctuation, casing, wording and Unicode characters are preserved.

## Proposed CMS model

The logical contract below is implemented by `schema.seed.json` and the deterministic draft mapper
in `seed.mjs`, verified against EmDash 1.0.1. `LOCAL-SEED.md` specifies the exact stored fields.
The runtime query adapter and typed failure contract are documented in `RUNTIME.md`.
Use plain text for the current copy; converting it to Portable Text is unnecessary for parity.
No blog posts, case-study routes, taxonomy, forms, plugin catalog or generic page builder is needed.

| Collection               | Cardinality           | Editable fields                                                                                                                      | Application-owned fields                                                                                                                              |
| ------------------------ | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `portfolio_home`         | One singleton         | Hero name/headline/description/aside/location, CTA labels, footer heading/description, section labels, SEO title/description/OG text | External ID; route/section/heading IDs; action destinations; canonical-host policy; theme color; robots policy; copyright structure; framework credit |
| `portfolio_projects`     | Five baseline records | title, category, description, ordered technologies, optional URL, optional media reference and alt                                   | External ID, position; constrained accent and image-fit presentation                                                                                  |
| `portfolio_experience`   | Three records         | date, role, company                                                                                                                  | External ID, position                                                                                                                                 |
| `portfolio_education`    | Two records           | date, role, company                                                                                                                  | External ID, position                                                                                                                                 |
| `portfolio_skill_groups` | Three records         | label, ordered items                                                                                                                 | External ID, position                                                                                                                                 |
| `portfolio_contacts`     | Three records         | label, URL; email address for email record                                                                                           | External ID, position, channel kind; derive mailto from address on writes                                                                             |

Public adapter contract: `loadPortfolio()` returns the fixture shape with only **published** CMS
values overlaid onto application-owned fields. It must surface missing required records or read
failures explicitly; do not silently replace an unavailable database with old published content.
Keep the fixture available as an explicit local/test input. All 17 baseline records are required
in this initial release; adding/removing records requires a reviewed contract change. Query ordering must use stored `position`, with external ID as a deterministic tie-breaker.
Reject duplicate IDs and missing singleton content. Do not expose drafts through anonymous queries.
Required field and URL validation belongs at the CMS boundary, including allowed link protocols,
media existence/alt text, accent/fit enums and consistent email address/mailto values.

The footer heading and `sections[5].title` are one CMS value, not two editable fields. Likewise,
hero/site/nav name should share one value if name editing is enabled. Published CTA copy changes
must not change anchors or the résumé download name. Admin field controls may eventually permit
reordering, but the initial migration must reproduce manifest positions exactly.

## Identity and idempotency proposal

1. Use the immutable `externalId` in `manifest.records`; never match by title, date, company,
   current array index, or a database-generated ID. The singleton key is `portfolio-v1:home` and
   combines `/hero`, `/footer`, `/sections`, and `/seo` mappings.
2. Store the mapping from external ID to CMS record ID in an import ledger or a schema field with
   uniqueness enforcement supported by the agreed storage layer. Runtime CMS IDs may differ.
3. Compute a canonical payload checksum after deterministic field mapping. A repeated run with
   the same external ID/checksum is a no-op. Create only absent records; report conflicting manual
   edits instead of overwriting them. Fail on duplicate source/target identities before writes.
4. Match media using manifest media ID and SHA-256. Keep source identity separate from the target
   CMS URL. Reuse identical imported bytes; alt text belongs to the image usage. Do not upload
   fonts, licenses, decorative grain or résumé LaTeX into the editable project-media collection.
5. Produce a dry-run plan of creates/no-ops/conflicts, with totals and stable IDs. Import all records
   into an isolated target, verify counts and hashes, and record the mapping before publishing.
   Rerunning must produce zero creates, updates or deletes. Failed runs resume from the ledger;
   never delete CMS entries merely because they are absent from this initial fixture.
6. Publication is a separate deliberate stage, not a side effect of import or cloud startup.
   `local-seed.mjs` verifies this proposal in disposable in-memory SQLite only. It cannot open an
   existing database, resolve Cloudflare bindings, or publish entries. Slugless EmDash 1.0.1 seeds
   preserve their explicit IDs, so this local implementation needs no additional identity ledger.

## Media and URL policy

Preserve the eight existing public asset paths listed in the manifest. Three project images keep
exact alt strings; the Advisors image retains `fit: logo` (contain), the others retain default cover.
Retain the two font license files. Favicon and résumé are currently bundler-resolved: manifest
`publicUrl: null` means the UI must resolve them, not render a null or invented path. Use
`hero.resumeAction.mediaId` to resolve the PDF and preserve `download="Hugo-Hsi-Resume.pdf"`.
The LaTeX source remains source-only. Binary hashes cover it and the downloadable PDF separately.

The old generated résumé URL in `manifest.decisions` is observed build evidence, not a hard-coded
source contract. Verify the live legacy URL before deciding a redirect. An eventual CMS media
upload may produce a new URL; keep existing public PNG URLs available through cutover rather than
blindly replacing fixture paths with CMS URLs. An importer must maintain the source-to-target
media map and the public adapter must resolve references explicitly.

## Decisions requiring a later focused change

- Canonical/OG use apex `hugohsi.dev`; sitemap/robots use `www.hugohsi.dev`. The fixture deliberately
  preserves the discrepancy. Agree host and redirect behavior in the SEO slice.
- Footer credit names SvelteKit. Preserve the baseline string here; the actual Astro credit is a
  separately reviewed migration copy change, not a CMS editor choice or an import rewrite.
- Store future images in CMS media only after the foundation/media owners agree binding and URL
  behavior. This fixture neither provisions storage nor fetches external content.

## Verification

Run with the repository's Node 24/pnpm toolchain from any working directory, adjusting the path:

```sh
pnpm exec node --test apps/astro-emdash/migration/portfolio/fixture.test.mjs
pnpm exec node --test apps/astro-emdash/migration/portfolio/legacy-parity.test.mjs
```

The first suite needs only this directory and Node built-ins; it validates inventory, stable
identity, reference integrity and preserved decisions. The second reads the original source and
media at repository root, checks baseline hashes, compares every exported data field and checks
component text/metadata parity. It intentionally fails if the recorded baseline changes or is
removed: rerun before removing legacy files, and retain its evidence for cutover. It uses Node's
built-in TypeScript stripping on trusted repository data modules; no Svelte/Vite dependencies run.
The additional `local-seed.test.mjs` suite verifies official seed validation and local import
idempotency with installed EmDash 1.0.1. It is explicitly skipped when that dependency is absent.
Set `PORTFOLIO_EMDASH_PACKAGE_ROOT` to the installed foundation app or disposable package directory
to require that integration run. The additional `portfolio-d1.test.mjs` covers actual emulated D1/R2, public querying and publication.
Remote D1/R2 remains untested and unprovisioned.
