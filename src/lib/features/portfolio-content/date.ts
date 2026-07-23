import type { DatePrecision } from './schemas';

export function formatPortfolioDate(value: string, precision?: DatePrecision): string {
	return new Intl.DateTimeFormat('en-US', {
		timeZone: 'UTC',
		year: 'numeric',
		...(precision === 'year' ? {} : { month: 'short' })
	}).format(new Date(value));
}
