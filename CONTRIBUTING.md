# Contribute to the portfolio

This guide explains how to propose source-code fixes and improvements. Do not include changes to personal portfolio content, media, résumé files, or branding unless Hugo requested them.

## Prepare the project

Use Node.js 24 and pnpm 11. Install dependencies and start the development server:

```sh
pnpm install
pnpm dev
```

Local development uses Portless, which provides a stable HTTPS URL and automatically assigns
branch-prefixed URLs to linked Git worktrees.

## Submit a focused change

Keep each change limited to one concern. Preserve public URLs and accessibility semantics unless the
issue requires a coordinated change.

Run the project checks before submitting a change:

```sh
pnpm lint
pnpm check
pnpm build
pnpm deploy:dry-run
```

Explain the behavior change, verification evidence, and any operational impact in the pull request.
Include screenshots for visible interface changes.
