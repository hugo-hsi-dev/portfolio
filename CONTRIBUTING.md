# Contribute to the portfolio

This guide explains how to propose source-code fixes and improvements. Do not include changes to personal portfolio content, media, résumé files, or branding unless Hugo requested them.

## Prepare the project

Use Node.js 24 and pnpm 11.11. Install dependencies and configure local variables:

```sh
pnpm install
cp .dev.vars.example .dev.vars
```

Replace the reset-token placeholder with a random value of at least 32 characters. Start both local processes with `pnpm dev`.

## Submit a focused change

Keep each change limited to one concern. Preserve public URLs, accessibility semantics, realtime protocol compatibility, and persisted frame identifiers unless the issue requires a coordinated migration.

Add tests at the closest useful layer:

- Unit tests for pure logic and schema validation
- Component tests for Svelte rendering and interaction
- Worker-runtime tests for Durable Object behavior
- Playwright tests for complete browser journeys

Run the complete local CI suite before submitting:

```sh
pnpm verify
```

Visual-regression baselines are platform-specific because Chromium text rasterization differs between macOS and Linux. When an intentional visual change affects them, run the visual suite with `--update-snapshots` on both platforms and review every changed image before committing:

```sh
pnpm exec playwright test tests/visual-regression.e2e.ts --update-snapshots
```

Explain the behavior change, test evidence, and any operational impact in the pull request. Include screenshots for visible interface changes.

## Report security issues

Do not disclose suspected vulnerabilities in a public issue. Follow the private process in [SECURITY.md](SECURITY.md).
