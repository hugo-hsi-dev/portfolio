# Hugo Hsi portfolio

This repository contains a multiplayer portfolio canvas built with SvelteKit and Cloudflare Durable Objects. This guide gets the full application running locally and explains how to update its content. See the [operations runbook](docs/operations.md) for production configuration, deployment, observability, and rollback.

## Prerequisites

Install these tools before you start:

- Node.js 24
- pnpm 11.11

A Cloudflare account is required only for production operations.

## Run the portfolio locally

Install dependencies and create the local Worker variable file:

```sh
pnpm install
cp .dev.vars.example .dev.vars
```

Replace the reset-token placeholder in `.dev.vars` with a random value of at least 32 characters. Keep the local origins from the example unchanged.

Start the SvelteKit application and realtime Worker:

```sh
pnpm dev
```

The application runs at `http://127.0.0.1:5173`, and the realtime Worker runs at `http://127.0.0.1:8788`. The supervisor prefixes output from both processes and stops both if either process fails.

Use the polling fallback if your environment has a low file-descriptor limit or blocks Wrangler’s user-level state directories:

```sh
pnpm dev:polling
```

The fallback stores Wrangler state and logs under `.wrangler/`. See [Troubleshoot local file watching](docs/operations.md#troubleshoot-local-file-watching) for details.

## Run focused project commands

Use `pnpm verify` before you open a pull request. It runs the same static checks, generated-type checks, coverage suites, builds, and audit enforced in continuous integration (CI).

| Command                     | Purpose                                           |
| --------------------------- | ------------------------------------------------- |
| `pnpm dev:app`              | Start only the SvelteKit development server       |
| `pnpm dev:realtime`         | Start only the realtime Worker                    |
| `pnpm preview`              | Run the production-shaped multi-Worker preview    |
| `pnpm lint`                 | Check formatting and ESLint rules                 |
| `pnpm check`                | Run Svelte and TypeScript checks                  |
| `pnpm gen:check`            | Confirm generated Cloudflare types are current    |
| `pnpm test:unit`            | Run application and contract unit tests           |
| `pnpm test:unit:coverage`   | Run application coverage with enforced thresholds |
| `pnpm test:worker`          | Run tests in the Cloudflare Workers runtime       |
| `pnpm test:worker:coverage` | Run Worker coverage with enforced thresholds      |
| `pnpm test:e2e`             | Run Playwright browser tests                      |
| `pnpm build:all`            | Build the application and both Worker deployments |
| `pnpm verify`               | Run the complete local CI suite                   |

## Understand the architecture

The application separates content, interface behavior, and cross-runtime contracts:

- `src/content` stores portfolio data as validated JSON frontmatter
- `src/lib/features/portfolio-content` loads content and builds the typed canvas document
- `src/lib/features/portfolio-board` contains board state, interactions, realtime client code, and Svelte components
- `packages/realtime-contract` defines protocol schemas, frame identifiers, limits, and persisted defaults shared by the browser and Worker
- `workers/realtime` contains the SQLite-backed `PortfolioRoom` Durable Object and its entry router
- `src/routes` contains thin SvelteKit page and endpoint adapters

The browser renders an accessible Document Object Model (DOM) canvas. Browse mode exposes the same content as a conventional document, and the Layers panel can recover frames moved anywhere in the shared world.

One Durable Object owns each board room. SQLite persists frame positions and room revisions. WebSocket attachments retain ephemeral cursors and selections across hibernation. The browser uses optimistic moves, last-write-wins revisions, and capped-jitter reconnection without an offline command queue.

## Update portfolio content

Content files consist of strict JSON between `---` fences. Markdown bodies and raw HTML are not supported. Validation rejects unknown fields, invalid asset paths, duplicate project order values, and invalid experience dates.

Follow this workflow for every content change:

1. Edit the relevant file under `src/content`
2. Add referenced assets under `static/media`
3. Run `pnpm test:unit`
4. Run `pnpm verify`

### Update projects

Create `src/content/projects/{slug}.md` with project frontmatter:

```md
---
{
  'title': 'Project name',
  'excerpt': 'Concise project description.',
  'context': 'work',
  'company': 'Company name',
  'order': 1,
  'liveUrl': 'https://example.com',
  'featuredImage': '/media/projects/project-name/hero.jpg',
  'featuredImageAlt': 'Description of the screenshot',
  'technologies': ['SvelteKit', 'TypeScript']
}
---
```

Set `context` to `work` or `personal`. Work projects require `company`. Provide `featuredImage` and `featuredImageAlt` together. Project order values must be unique.

### Update experience

Create `src/content/experience/{slug}.md` with typed highlights:

```md
---
{
  'company': 'Company',
  'role': 'Full-Stack Developer',
  'startDate': '2023-01-01',
  'isCurrent': true,
  'highlights':
    ['Built an accessible product workflow.', 'Reduced deployment failures with CI checks.']
}
---
```

Use `endDate` for completed roles and omit it when `isCurrent` is `true`. Dates use `YYYY-MM-DD`. Add each displayed achievement to `highlights`; do not add a Markdown body.

### Update education

Create `src/content/education/{slug}.md` with an institution, degree, and completion date:

```md
---
{
  'institution': 'Institution',
  'degree': 'Degree',
  'completionDate': '2024-05-01',
  'datePrecision': 'month'
}
---
```

### Update site details and technologies

Edit `src/content/site.md` for the hero, contact details, footer, search metadata, and optional résumé path. Remove `resumeUrl` to hide the résumé action.

Edit `src/content/technologies.md` to update the `frontend`, `backend`, `database`, and `tools` arrays. Each array retains its authored order.

## Add media

Use public asset paths that begin with `/media/`:

```text
static/
  fonts/
  media/
    projects/{project-slug}/hero.jpg
    resume/hugo-hsi-resume.pdf
    site/social-preview.jpg
```

Project hero images use a 16:9 aspect ratio at 1600 by 900 pixels. Keep screenshots readable and relevant to the project. Content tests verify that every referenced media file exists.

## Review design and accessibility

The interface preserves semantic landmarks, keyboard navigation, visible focus, reduced-motion behavior, and an alternate Browse mode. Run `pnpm test:e2e` after interaction or layout changes.

The historical visual direction remains documented in `HOMEPAGE_REDO_DESIGN_RECORD.md`.

## License

Source code is available under the MIT license. Personal content, media, résumé files, and branding are excluded. Bundled fonts retain their SIL Open Font License terms. See [LICENSE.md](LICENSE.md) for the complete scope.
