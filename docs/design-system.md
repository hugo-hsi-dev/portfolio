# Wave 3 — Design System

## Color tokens

```css
--paper: #f2efe7;
--paper-raised: #faf8f2;
--ink: #171714;
--ink-soft: #5f605a;
--line: #c8c4ba;
--line-strong: #77776f;
--correction: #2455d6;
--inverse: #f7f5ee;
--inverse-soft: #b8bab3;
```

Correction blue is not decorative seasoning. Use it for links, keyboard focus, active proof states, and the moment a relationship is being inspected or revised.

## Typography

Use one variable family—Recursive—across the system when practical.

- Proportional, restrained settings carry narrative and display language.
- Its mono axis is reserved for literal machine output, tools, dates, and quantitative evidence.
- The family changing register without changing identity embodies coherence through change.
- If loading or rendering is unstable, retain the roles with system sans and system mono; meaning outranks the font trick.

```css
--font-primary: 'Recursive', ui-sans-serif, system-ui, sans-serif;
--font-system: 'Recursive', ui-monospace, SFMono-Regular, Menlo, monospace;
--step-hero: clamp(3.3rem, 7.4vw, 8.1rem);
--step-section: clamp(2.5rem, 5vw, 5.4rem);
--step-project: clamp(2rem, 3.6vw, 4rem);
--step-lead: clamp(1.08rem, 1.5vw, 1.32rem);
--step-body: 1rem;
--step-data: 0.76rem;
```

Uppercase is limited to short system labels. Monospace must never stand in for “technical-looking.”

## Layout and spacing

```css
--content-max: 96rem;
--page-gutter: clamp(1rem, 3vw, 2.5rem);
--section-space: clamp(6rem, 11vw, 11rem);
--grid-gap: clamp(1rem, 2vw, 2rem);
--measure-copy: 40rem;
--measure-lead: 52rem;
```

Spacing rhythm: `4, 8, 12, 16, 24, 32, 48, 72, 104, 152`.

Page structure has square edges. Radius is used only where an actual product surface requires it. There are no default shadows.

## Motion tokens

```css
--ease-resolve: cubic-bezier(0.22, 1, 0.36, 1);
--duration-fast: 160ms;
--duration-ui: 280ms;
--duration-intro: 900ms;
```

Scroll-linked values interpolate linearly. Settling into a resting state uses `--ease-resolve`.

## Components in scope

1. Site header and section navigation
2. Text/action links
3. Hero composition
4. Evidence/proof record
5. Sticky systems chapter
6. Product record with functional sequence
7. Experience and education record
8. Contact invitation and footer

Do not create components for every label, rule, or type style.
