import type { Portfolio } from '../../lib/server/portfolio';

/** The presentation consumes the validated, published-only server contract. */
export type { Portfolio };
export type Project = Portfolio['projects'][number];
