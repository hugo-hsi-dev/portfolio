import type fixture from '../../../migration/portfolio/fixture.json';

/** Shared presentation shape; content is supplied by the published-only server loader. */
export type Portfolio = typeof fixture;
export type Project = Portfolio['projects'][number];
