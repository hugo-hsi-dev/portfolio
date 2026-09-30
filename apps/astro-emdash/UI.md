# Portfolio UI parity

The public presentation accepts the ordered portfolio shape in
`migration/portfolio/CONTRACT.md`. `src/components/portfolio/Portfolio.astro` renders
provided data; it does not load content or provide fallback values. Presentation types
reference the CMS-exported `Portfolio` through type-only imports. CMS schema, querying,
validation and publication belong to the CMS slice.

## Explicit development input

Run `pnpm migration:dev` and use the Portless-reported URL with `/dev/portfolio`.
This route explicitly supplies the fixture for visual and interaction testing. It
returns 404 from a built Worker, sets `no-store`, and requests no indexing. It is not
the public CMS-backed route and must never be used as a database-failure fallback.

The public `/` route calls `src/lib/server/portfolio.ts`
`loadPortfolio(): Promise<Portfolio>` on every request. Any loader failure, including
missing required published content, returns minimal generic HTTP 503 HTML with
`Cache-Control: private, no-store` and `X-Robots-Tag: noindex`. Successful responses
use `no-store` so publication changes appear on the next request. Request query
parameters never select draft/preview content.
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
Integration base after CMS rebase: `e13d5f274b519c0b2df781c535d6ae59301ab3eb`.
Cloud checks used Node 24.19.0 and pnpm 11.22.0.

Run `pnpm migration:check`, `pnpm migration:build`, `pnpm migration:smoke`, and
`pnpm exec node --test apps/astro-emdash/tests/*.test.ts`. The public CMS/browser
integration test is `pnpm exec node --test apps/astro-emdash/tests/ui-public-d1.test.mjs`. Legacy checks remain
`pnpm lint`, `pnpm check`, `pnpm test`, and `pnpm deploy:dry-run`.

In an agent environment, Astro 7 may automatically detach its dev/preview process.
Use `pnpm --filter @portfolio/astro-emdash dev --ignore-lock` to keep the existing
Portless command attached. The merged CMS slice adds the supported `--ignore-lock`
flag to the smoke runner and disables optional admin font fetching. Writable
`XDG_CONFIG_HOME` and `PNPM_HOME` directories may be needed in a sandbox. These are
command-local environment settings, not deployment configuration.

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

The initial screenshots exercise the explicit development fixture route. The separate
public CMS/browser integration test uses isolated local D1/R2 state and compares
published content against those same captures, including CMS-hosted image URLs. It
checks draft-only/missing content 503 responses, private pending edits, publication
visibility and deliberate unpublish/republish recovery. It never creates an admin or
connects to live resources. [CMS route results](tests/evidence/cms-public-route.json)
record all eight zero-pixel comparisons, publication states and original image hashes.
The recorded media URLs belong to the disposed local test database, not a deployment.
Real admin/passkey workflows, persistent staging, and backup/recovery remain separate gates.

The UI test places its disposable app under ignored `.astro/ui-d1-temp` and restores
`TMPDIR` afterward. This keeps the app and pnpm dependency real paths under a common
filesystem ancestor: Astro 7 otherwise rebases an absolute EmDash CSS module path
under `/tmp`, causing a development error overlay. The shared CMS harness, route
authentication, dependency files and browser assertions are unchanged.

A reusable browser harness requires Python Playwright and Chromium (already present
in this cloud environment). The CMS integration test additionally requires Pillow.
Supply the actual Portless URL explicitly:

```sh
python apps/astro-emdash/tests/ui-browser.py \
  --url http://portfolio-astro-emdash.localhost:1355/dev/portfolio \
  --out /tmp/portfolio-ui-validation
```

It derives expected content/link ordering from the fixture, compares downloaded PDF
bytes to the source file and asserts interaction behavior. Persisted lifecycle events
are simulated; this is not a claim that an actual browser bfcache navigation occurred.
