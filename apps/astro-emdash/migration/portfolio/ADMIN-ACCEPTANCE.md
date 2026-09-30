# Disposable admin acceptance

These tests exercise EmDash 1.0.1's actual admin UI, protected HTTP endpoints, Astro sessions,
and Cloudflare D1/R2/SESSION emulation. They never target an existing database or remote service.
They do not complete Hugo's account onboarding.

`admin-harness.mjs` copies the app into a new sibling temporary directory, validates the reviewed
local-only Wrangler configuration, builds it, and runs the built Worker on loopback. A sibling
directory keeps Astro 7's stylesheet paths and installed dependencies under a shared parent;
putting the copied app under `/tmp` caused EmDash admin stylesheet compilation to fail here.
Each run has its own Vite cache, HOME, temporary files, D1/R2/KV state, and random fixture token.
The child receives an allowlist of environment variables, never cloud credentials or app env files.
The process is stopped and the directory removed in `finally`.

`testing/admin-route.ts` is a template outside production `src`. Only the disposable config injects
it. It accepts two fixed `.invalid` identities, creates their users through `UserRepository`, and
uses Astro's real `session.set('user', {id})`. It does not forge a cookie, override `locals.user`,
enroll a passkey, or change product authentication. The next request uses ordinary EmDash auth and
permissions. Missing/wrong fixture tokens return 404; arbitrary identities, extra fields and
administrator roles are rejected. The fixture marks only its new database's setup complete and
explicitly publishes the checked-in baseline for the rehearsal.

## Run

Use the repository's Node 24 and pnpm 11.22 bootstrap first. HTTP acceptance runs in
`pnpm migration:check` without extra dependencies. Browser acceptance explicitly skips when neither
browser variable is supplied; supplying only one, an invalid package root, or a bad executable fails.

To require Chromium acceptance without editing repository manifests, install the pinned test driver
in a disposable directory, then use an existing Chromium executable:

```sh
browser_deps=$(mktemp -d)
cat > "$browser_deps/package.json" <<'JSON'
{"private":true,"type":"module","dependencies":{"playwright-core":"1.63.0"}}
JSON
pnpm --dir "$browser_deps" install --ignore-scripts

PORTFOLIO_BROWSER_PACKAGE_ROOT="$browser_deps" \
PORTFOLIO_CHROMIUM_EXECUTABLE=/absolute/path/to/chromium \
  pnpm exec node --test apps/astro-emdash/migration/portfolio/admin-*.test.mjs

rm -rf "$browser_deps"
```

Chromium uses `--no-sandbox` for this managed container; run this isolated harness only in a trusted
test environment. Its browser context blocks requests outside the disposable origin. Chromium sends
Secure cookies to loopback HTTP, while Playwright's HTTP client does not; protected HTTP preparation
replays only the actual Astro-issued session cookie, without changing its value or flags. Public
route reads are anonymous. No screenshots, cookies or credentials are saved as artifacts.

## Verified behavior

- Anonymous and subscriber mutations fail; editor sessions resolve the real editor role. Missing
  EmDash's mutation CSRF header fails. Logout invalidates the session; no passkeys are enrolled.
- Actual editor Save persists a draft through reload while the public route retains the live copy.
  Publish changes updates the public page. Unpublishing required home content returns the generic
  503/noindex page; Publish now restores it.
- Changing the application-owned position field fails through the real policy hook. The browser
  displays a save error and the protected draft data remains unchanged.
- Multipart upload writes deterministic valid PNG bytes to local R2. The protected media replacement
  endpoint replaces the bytes at the same storage key. Ready images with nonempty alt metadata can
  be selected and replaced through the real admin picker, saved, and explicitly published. Draft
  image changes do not leak through the public loader.
- The actual first-login welcome dialog is dismissed with its Get Started button. No product code
  suppresses onboarding or authentication for tests.

## Remaining acceptance gates

Synthetic post-login sessions do **not** verify initial administrator enrollment, WebAuthn login,
account recovery, OAuth, email delivery, or Hugo's real account. Those remain separate onboarding
gates and require an approved ceremony/configuration. No real account or credentials were created.

The policy rejection currently displays EmDash's generic `CONTENT_HOOK_ERROR` message,
“A plugin hook failed while saving content”. It does not tell an editor which immutable field caused
the failure. The tests prove rejection and preservation, not actionable field-specific errors.

Browser media coverage uses the HTTP upload endpoint to prepare synthetic assets, then the real
selection/replacement picker. It does not claim browser drag-and-drop/file-upload, external providers,
paid transforms, accessibility certification, or deployed staging storage have passed. Real staging
bindings, access controls, account onboarding, storage persistence and deployment rollback still need
their own approved acceptance run.

API references: [EmDash authentication](https://docs.emdashcms.com/guides/authentication/),
[Playwright isolated browser contexts](https://playwright.dev/docs/api/class-browsercontext).
Exact behavior was checked against the installed pinned EmDash 1.0.1 package and actual Worker.
