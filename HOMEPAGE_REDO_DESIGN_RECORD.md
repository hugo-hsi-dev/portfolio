# Homepage Redo Design Record

This records the current one-page portfolio design so the redo can recreate it 1:1 without carrying over the old implementation.

## Page Shape

- One long scrolling page.
- Background starts cream, then alternates into charcoal timeline sections, cream tech/lab, and a charcoal footer.
- Max content width is `72rem` (`max-w-6xl`) centered inside each section.
- Outer horizontal padding is `pl-8 pr-6` on mobile and `lg:px-12` on large screens.
- No rounded cards. Edges are square.
- No decorative imagery except the project screenshots, subtle grain, icons, and scroll progress line.
- The page shell uses `min-h-dvh overflow-x-hidden`.

Section order:

1. Fixed navigation
2. Hero
3. Selected Work
4. Experience
5. Education
6. Tech Stack
7. Lab
8. Footer/contact

## Design Tokens

Fonts:

- Sans: `Outfit`, fallback `ui-sans-serif, system-ui, sans-serif`
- Serif/display: `Forum`, fallback `ui-serif, Georgia, serif`

Colors:

```css
--color-charcoal: #1a1a1a;
--color-cream: #f8f6f1;
--color-cream-light: #f0ece3;
--color-cream-lighter: #e8e4db;
--color-stone: #8b8680;
--color-slate: #5a5a5a;
--color-stone-light: #b8b4ab;
--color-gold: #c4a35a;
--color-sage: #7a9a8a;
--color-border: #333;
```

Type scale:

- Hero headline: serif `text-4xl md:text-5xl lg:text-6xl`, `leading-[1.1]`.
- Section headings: serif `text-4xl lg:text-5xl`, tight tracking.
- Footer heading: serif `text-4xl lg:text-6xl`.
- Project title: serif `text-2xl lg:text-3xl`.
- Timeline title: serif `text-xl lg:text-2xl`.
- Labels/counters: sans `text-xs uppercase tracking-[0.2em]`.
- Body: sans `text-base`, relaxed line height.

Spacing:

- Hero: `min-h-screen`, vertical center, `pt-24 pb-16`.
- Main sections: `py-24 lg:py-32`.
- Section header bottom margin: `mb-16`, Lab uses `mb-12`.
- Project list gap: `space-y-20`.
- Timeline item gap: `space-y-16`.

## Navigation

- Fixed at top, full width, `z-50`, `mix-blend-difference`.
- Padding: `pl-8 pr-6 lg:px-12 py-6`.
- Left item is the name, serif `text-xl`, white. It fades/slides in only after the hero eyebrow scrolls out of view.
- Right side has GitHub and LinkedIn icon links, 20px icons, `text-white/80` to white on hover, `gap-6`.
- Icon buttons use a magnetic hover offset unless reduced motion is active.
- No section links in the nav.

## Hero

Section:

- Cream background inherited from page wrapper.
- `min-h-screen flex flex-col justify-center`.
- Contains a fixed vertical scroll progress line at `left-2 lg:left-6`, width `2px`, cream-lighter track with gold fill.
- Contains a full-section SVG noise/grain overlay at opacity `0.02`, animated slowly.

Layout:

- Inner grid: `grid-cols-1 lg:grid-cols-12`, `gap-12 lg:gap-8`, `items-end`.
- Main copy spans `lg:col-span-8`.
- Quote spans `lg:col-span-4`, right aligned on large screens.

Hero content:

- Eyebrow: `Hugo Hsi`, sans, `text-sm uppercase tracking-[0.2em] text-stone mb-6`.
- H1: `Engineering products from design to database.`
- Intro: `Software engineer specializing in React, Next.js, and Node.js. I bring hands-on agency experience working directly with clients to deliver thoughtfully engineered applications.`
- Primary CTA: `View my work`, href `#projects`.
- Secondary CTA: `Download resume`, shown only if a resume URL exists.
- Quote: `Beyond the keyboard, I'm a badminton coach, an avid gamer, and an active proponent of taking a proper break to do absolutely nothing.`
- Quote is serif, `text-sm text-stone italic leading-relaxed`; quote marks are gold.

CTA buttons:

- Square rectangle, no radius.
- Solid variant: charcoal background, cream text, `px-6 py-3`, sans `text-sm uppercase tracking-wider`.
- Outline variant: transparent/cream background, charcoal border and text.
- Hover slides an overlay from left to right; text becomes cream.

Hero motion:

- Eyebrow fades up on load.
- H1 uses typewriter text at `35ms` per character after `0.3s`; cursor is `2px` wide and blinks every `530ms`.
- Intro, CTAs, and quote appear after typewriter completion.
- Reduced motion shows all text immediately and disables scroll progress.

## Selected Work

Section:

- `id="projects"`.
- Cream background.
- Header is a flex row: left title `Selected Work`, right counter like `3 Projects`.
- Header bottom margin `mb-16`.

Project card layout:

- Each project is an article with a hover lift on desktop: `hover:-translate-y-1 hover:shadow-lg`; active scale `0.98` on mobile.
- Each card uses a `lg:grid-cols-12` grid with `gap-6 lg:gap-8`.
- Image area spans `lg:col-span-7`.
- Text spans `lg:col-span-5 lg:pt-4`.
- Whole card is a link if `liveUrl` exists.

Image area:

- Aspect ratio is `16 / 9`.
- Image object fit is cover.
- Work project placeholder/background: `cream-lighter`.
- Personal project placeholder/background: `cream-light`.
- Thin ring: `ring-1 ring-black/[0.08]`.
- Image scales slightly on desktop hover.
- If no image exists, show the project title centered in serif `text-lg text-stone-light`.

Project text:

- Category label: sans `text-xs uppercase tracking-[0.2em] mb-3 block`.
- Work label: gold text, `Client Work at {company}`.
- Personal label: sage text, `Personal Project`.
- Title: serif `text-2xl lg:text-3xl mb-3`.
- Excerpt: sans slate, relaxed, `mb-4`.
- Tech tags: inline wrap, `gap-2 mb-4`, each tag `text-xs px-2 py-1 bg-cream-lighter text-slate`.
- Link affordance: `Visit site` with animated underline and 14px external-arrow icon.

Seed projects:

1. `National Medal of Honor Museum`
   - Context: work
   - Company: `Praxis Loop`
   - URL: `https://mohmuseum.org/`
   - Excerpt: `Solo-developed a massive WordPress-to-Prismic migration, replacing legacy MUI with a custom Next.js and Tailwind frontend.`
   - Tech: `Next.js`, `Tailwind CSS`, `Prismic`
2. `1st Avenue Advisors`
   - Context: work
   - Company: `Praxis Loop`
   - URL: `https://www.1staveadvisors.com/`
   - Excerpt: `Translated high-fidelity Figma designs into responsive Next.js and Tailwind components, integrating complex frontend forms with backend mailing services.`
   - Tech: `Next.js`, `Tailwind CSS`, `shadcn/ui`
3. `MineCentral`
   - Context: personal
   - URL: `https://www.minecentral.net/`
   - Excerpt: `Co-developed a comprehensive Minecraft server hosting platform with Stripe payments, driving the database architecture, custom UI, and codebase maintainability.`
   - Tech: `Next.js`, `Tailwind CSS`, `Stripe`

## Experience

Section:

- Charcoal background, cream text.
- `py-24 lg:py-32`.
- Header title `Experience`; right counter like `1 item`.
- No top border on Experience.

Timeline:

- Relative container with vertical line at `left-[19px] top-2 bottom-2`, width `1px`, color border.
- Items have `pl-12`, with a tiny `3px` stone dot at `left-[-5px] top-[7px]`.
- Date label: sans `text-xs uppercase tracking-[0.2em] text-stone`.
- Date format is year only, e.g. `2023 - Present`.
- Title: role, serif `text-xl lg:text-2xl`.
- Subtitle: company, sans `text-base text-gold`.

Seed item:

- Role: `Full-Stack Developer`
- Company: `Praxis Loop`
- Date: `2023 - Present`

## Education

Same timeline component as Experience.

Differences:

- Charcoal background continues.
- Has top border: `border-t border-border`.
- Header title `Education`; right counter like `1 item`.

Seed item:

- Degree: `BFA in Graphic Design`
- Institution: `Your University`
- Date: `2015 - 2019`

## Tech Stack

Section:

- Cream background.
- Header only has title `Tech Stack`; no right counter.
- Category grid: `grid-cols-2 md:grid-cols-4`, `gap-8 lg:gap-12`.

Categories:

- Category heading: sans `text-xs uppercase tracking-[0.2em] text-stone mb-4`.
- Items: sans `text-base`, vertical `space-y-2`.
- Data is grouped by category but sorted alphabetically globally before grouping in the old app. For exact visual order, use the order below.

Seed visible items:

- Frontend: `Next.js`, `React`, `shadcn/ui`, `Svelte`, `Tailwind CSS`
- Backend: `Express`, `Node.js`, `Stripe`, `TypeScript`
- Database: `MongoDB`, `PostgreSQL`, `Redis`
- Tools: `Docker`, `Figma`, `Git`, `Payload CMS`, `Prismic`

## Lab

Section:

- Background `cream-light`.
- Header row: left title `Lab`, right label `Experiments & Learning`.
- Cards grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`.

Cards:

- Square card, no border, no radius.
- `p-6 bg-cream hover:bg-white`.
- Title: serif `text-lg mb-2`; shifts right `translate-x-1` on hover.
- Description: sans `text-sm text-slate mb-3`.
- Tech line: sans `text-xs text-stone`.
- Card is a link only if `githubUrl` is present.

Seed lab items, sorted alphabetically by name in the old app:

- `Color Palette Gen` - `Algorithmic color scheme generator` - `TypeScript, Canvas`
- `Go API Server` - `REST API with middleware and auth` - `Go, PostgreSQL`
- `Portfolio v1` - `Previous iteration of this site` - `Next.js, MDX`
- `Rust CLI Tool` - `File processing utility built to learn Rust` - `Rust`
- `Task Tracker` - `Local-first productivity app` - `Svelte, SQLite`
- `Weather Dashboard` - `Real-time data visualization` - `React, D3.js`

## Footer

Section:

- Charcoal background, cream text.
- Mobile/tablet footer is tall: `.footer-fullscreen { min-height: 110dvh; }` under `1024px`.
- Footer is `flex flex-col justify-end` on small screens, normal block layout on large screens.
- Padding: `pt-16 pb-12 lg:py-24 xl:py-32`.

Main layout:

- `grid-cols-1 lg:grid-cols-2`, `gap-16 mb-16`.
- Left:
  - Heading: `Let's work together`
  - Paragraph: `I'm currently available for full-time engineering roles. Based in NYC, open to remote opportunities.`
- Right:
  - Large email link, right aligned on large screens.
  - Envelope icon 24px.
  - Social text links below.

Footer contact content:

- Email: `hello@hugohsi.dev`
- GitHub: `https://github.com`
- LinkedIn: `https://linkedin.com`

Bottom bar:

- `pt-8 border-t border-border`.
- Flex column on mobile, row on `md`.
- Text is sans `text-xs text-stone`.
- Left: `(c) {current year} Hugo Hsi. All rights reserved.`
- Right: `Built with Next.js, TypeScript, and attention to detail.`

## Motion And Interaction Rules

- Use `motion` animations, but every animation must respect reduced motion.
- Scroll reveal: opacity `0 -> 1`, y `40 -> 0`, duration `0.6s`, easing `[0.25, 0.46, 0.45, 0.94]`, reveal once at 10% visibility.
- Staggered reveal: child delay `0.1s`, item y `30 -> 0`, duration `0.5s`.
- Magnetic links use spring `{ damping: 15, stiffness: 150 }` and reset on mouse leave.
- Animated underlines scale from left over `300ms`.
- The old design uses hover transforms only for desktop where possible; keep mobile interactions subtle.

## Responsive Rules

- Below `lg`, every major grid stacks into one column.
- Project cards become image first, text second.
- Footer email/social align left on mobile, right on large screens.
- Header rows keep their baseline flex layout; if space becomes tight in the redo, preserve the visual priority: title first, counter/label secondary.
- Keep hero text max widths: H1 `max-w-2xl`, intro `max-w-lg`.

## Data Needed For A 1:1 Redo

Minimum content model:

- Homepage hero group: first name, last name, tagline, intro, primary CTA text/link, secondary CTA text, quote, resume URL.
- Contact: email, GitHub URL, LinkedIn URL.
- Projects: title, excerpt, optional featured image with alt text, live URL, technologies, context, company, order.
- Experience: company, role, start date, optional end date, current flag.
- Education: institution, degree, start date, optional end date.
- Technologies: name, category.
- Lab: name, description, technologies text, optional GitHub URL.

Images:

- No local project images are committed in the current repo.
- Current visual behavior depends on uploaded CMS media. If unavailable, use the existing text placeholder behavior above.

## Implementation Notes For Redo

- Rebuild as one page first. Do not add case-study pages, blog, contact form, filters, or nav sections unless explicitly requested later.
- Keep the page visually asset-light; project screenshots are the main media.
- Preserve square edges and restrained palette. Rounded cards, gradients, decorative blobs, and heavy shadows would not match the current design.
- The old app uses Payload for content, but the redo can start with static data matching this record.
