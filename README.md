# Hugo Hsi Portfolio

A one-page SvelteKit portfolio backed by repository-authored Markdown and static media. Content is validated at build time and deployed through the Cloudflare adapter.

## Development

```sh
pnpm install
pnpm dev
```

Quality checks:

```sh
pnpm lint
pnpm check
pnpm test:unit
pnpm test:e2e
pnpm build
```

`pnpm preview` serves the Cloudflare build on `http://localhost:4173`.

## Content Workflow

Content lives in `src/content`. Each file starts with strict JSON between `---` fences. The optional Markdown body is parsed with `marked`; it is trusted repository content and is not sanitized.

1. Add or edit a Markdown file.
2. Add referenced media under `static/media`.
3. Run `pnpm test:unit` to validate content and asset paths.
4. Run `pnpm check` and `pnpm build` before committing.

Collection order is automatic:

- Projects use ascending `order` values, which must be unique.
- Experience and education use newest `startDate` first.
- Lab entries sort alphabetically by `name`.
- Technology arrays retain their authored order.
- Empty education and lab collections are hidden from the homepage.

### Site

`src/content/site.md` owns the hero, contact details, footer, metadata, and optional resume path.

```md
---
{
  'hero':
    {
      'firstName': 'Hugo',
      'lastName': 'Hsi',
      'tagline': 'Engineering products from design to database.',
      'intro': 'Short introduction.',
      'ctaPrimary': { 'text': 'View my work', 'link': '#projects' },
      'ctaSecondary': { 'text': 'Download resume' },
      'quote': 'Optional quote.'
    },
  'contact':
    {
      'email': 'hello@example.com',
      'github': 'https://github.com/example',
      'linkedin': 'https://www.linkedin.com/in/example/'
    },
  'footer':
    {
      'heading': "Let's work together",
      'intro': 'Availability and location.',
      'builtWith': 'Built with SvelteKit and TypeScript.'
    },
  'seo':
    {
      'title': 'Name | Role',
      'description': 'Search and social description.',
      'canonicalUrl': 'https://example.com',
      'image': '/media/site/social-preview.jpg',
      'imageAlt': 'Social preview description',
      'keywords': ['keyword'],
      'themeColor': '#F8F6F1',
      'jobTitle': 'Full-Stack Developer'
    },
  'resumeUrl': '/media/resume/name-resume.pdf'
}
---
```

Remove `resumeUrl` to hide the resume button. `ctaSecondary` may remain in place.

### Projects

Create `src/content/projects/{slug}.md`:

```md
---
{
  'title': 'Project name',
  'excerpt': 'Concise card description.',
  'context': 'work',
  'company': 'Company name',
  'order': 1,
  'liveUrl': 'https://example.com',
  'featuredImage': '/media/projects/project-name/hero.jpg',
  'featuredImageAlt': 'Description of the project screenshot',
  'technologies': ['SvelteKit', 'TypeScript']
}
---

Optional Markdown retained for future long-form use.
```

`context` is `work` or `personal`. Work projects require `company`. A featured image and its alt text must be provided together.

### Experience

Create `src/content/experience/{slug}.md`:

```md
---
{
  'company': 'Company',
  'role': 'Full-Stack Developer',
  'startDate': '2023-01-01',
  'isCurrent': true
}
---

Optional Markdown description displayed in the timeline.
```

Use `endDate` for completed roles and omit it when `isCurrent` is true. Dates must use `YYYY-MM-DD`.

### Education

Create `src/content/education/{slug}.md`:

```md
---
{
  'institution': 'Institution',
  'degree': 'Degree',
  'startDate': '2015-01-01',
  'endDate': '2019-01-01'
}
---

Optional Markdown description displayed in the timeline.
```

### Lab

Create `src/content/lab/{slug}.md`:

```md
---
{
  'name': 'Experiment name',
  'description': 'One-line description.',
  'technologies': 'Svelte, SQLite',
  'githubUrl': 'https://github.com/example/project'
}
---
```

`githubUrl` is optional. Entries without it render as non-interactive cards.

### Technologies

`src/content/technologies.md` contains the four supported groups:

```md
---
{
  'frontend': ['Svelte', 'React'],
  'backend': ['Node.js', 'TypeScript'],
  'database': ['PostgreSQL'],
  'tools': ['Git', 'Figma']
}
---
```

## Media

Static assets use public paths beginning with `/media/`:

```text
static/
  fonts/
  media/
    projects/{project-slug}/hero.jpg
    lab/{lab-slug}/...
    resume/hugo-hsi-resume.pdf
    site/social-preview.jpg
```

Project hero images are 1600 by 900 pixels. Keep screenshots readable, crop them to 16:9, and avoid decorative or unrelated imagery. The content test verifies that every referenced media file exists.

## Design System

Foundations live in `src/routes/layout.css`: self-hosted Forum and Outfit fonts, the cream/charcoal/gold/sage palette, page gutters, section spacing, focus styles, and motion easing. Repeated interface behavior lives in `src/lib/components`:

- `InkLink` for primary and outline calls to action.
- `ProjectCard` for selected work.
- `Timeline` for experience and education.
- `SectionHeader` for section titles and counts.
- `Reveal` and `ScrollProgress` for reduced-motion-safe movement.
- `SocialLink` and `BrandIcon` for accessible profile links.

The historical source design is recorded in `HOMEPAGE_REDO_DESIGN_RECORD.md`.
