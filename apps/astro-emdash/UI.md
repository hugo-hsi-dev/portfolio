# Portfolio UI parity

The public presentation accepts the ordered portfolio shape in
`migration/portfolio/CONTRACT.md`. `src/components/portfolio/Portfolio.astro` renders
provided data; it does not load content or provide fallback values. The fixture import
in `types.ts` is type-only. CMS schema, querying, validation and publication belong to
the CMS slice.

## Explicit development input

Run `pnpm migration:dev` and use the Portless-reported URL with `/dev/portfolio`.
This route explicitly supplies the fixture for visual and interaction testing. It
returns 404 from a built Worker, sets `no-store`, and requests no indexing. It is not
the public CMS-backed route and must never be used as a database-failure fallback.

The CMS integration must supply `src/lib/server/portfolio.ts` with
`loadPortfolio(): Promise<fixture shape>`. Public loader failures or missing required
published content must return a minimal generic HTTP 503 without internal details.
Required presentation references include the six ordered sections, email contact,
both navigation contact IDs and the application-owned `resume-pdf` media ID.
Optional project images and URLs remain optional.

## Preserved behavior

- Exact content, labels, section fragments, ordered records, canonical/OG values,
  existing sitemap/robots host discrepancy, and SvelteKit footer credit.
- Original font, image, grain, favicon and PDF bytes, including font licenses.
- Bundled resume download with `Hugo-Hsi-Resume.pdf`; compatibility copies at
  `/resume/hugo-hsi-resume.pdf` and the baseline built URL
  `/_app/immutable/assets/hugo-hsi-resume.BZP4g5vC.pdf`. Both match the source PDF hash.
- Full visible HTML without JavaScript; enhancements supply typewriter, hero
  cascade, one-time reveals, nav-name observation, magnetic links and scroll progress.
- Reduced-motion changes consume entrances. Persisted page restoration reconnects
  interactions without replaying typing or hiding already-visible content.

## Verification

Baseline source: `326c112c709f93bba6fb4701d03870383a316424`.
Integration base: `a1ee7b7fbdce1af92a334e108975cc6aef0b8ed9`.
Cloud checks used Node 24.19.0 and pnpm 11.22.0.

Run `pnpm migration:check`, `pnpm migration:build`, `pnpm migration:smoke`, and
`pnpm exec node --test apps/astro-emdash/tests/*.test.ts`. Legacy checks remain
`pnpm lint`, `pnpm check`, `pnpm test`, and `pnpm deploy:dry-run`.

In an agent environment, Astro 7 may automatically detach its dev/preview process.
For these local checks, `ASTRO_DEV_BACKGROUND=1` keeps the existing Portless command
attached; `ASTRO_PREVIEW_BACKGROUND=1` keeps the existing smoke runner attached.
Writable `XDG_CONFIG_HOME` and `PNPM_HOME` directories may be needed in a sandbox.
These are command-local environment settings, not deployment configuration.

The current environment cannot fetch the EmDash admin's Google Fonts metadata.
Builds complete with that warning; portfolio fonts are local and fully loaded.

### Browser evidence

The following full-page captures have **zero differing pixels** against the legacy
source baseline with identical viewport, reduced-motion and settled-image settings:

- [375 × 812](tests/evidence/astro-375.png)
- [768 × 1024](tests/evidence/astro-768.png)
- [1440 × 1000](tests/evidence/astro-1440.png)
- [375 × 812, JavaScript disabled](tests/evidence/astro-375-nojs.png)

[Comparison metrics](tests/evidence/pixel-comparison.json) cover the three responsive
captures. No-JavaScript was also compared with zero differing pixels. All three
project images and both fonts finished loading before capture. No browser errors or
horizontal overflow were found. Keyboard order/skip focus, typing, reveal cleanup,
header scrolling, magnetic movement, reduced-motion toggling, missing observer
support, cursor visibility without JavaScript and PDF bytes were verified.

Evidence currently exercises the explicit development fixture route. Published CMS
success, missing-content 503 and draft exclusion require the CMS loader integration;
these checks must not be reported as published-content verification.

A reusable browser harness requires Python Playwright and Chromium (already present
in this cloud environment). Supply the actual Portless URL explicitly:

```sh
python apps/astro-emdash/tests/ui-browser.py \
  --url http://portfolio-astro-emdash.localhost:1355/dev/portfolio \
  --out /tmp/portfolio-ui-validation
```

It derives expected content/link ordering from the fixture, compares downloaded PDF
bytes to the source file and asserts interaction behavior. Persisted lifecycle events
are simulated; this is not a claim that an actual browser bfcache navigation occurred.
