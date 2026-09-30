import application from './portfolio-application.json' with { type: 'json' };
import schema from '../../../migration/portfolio/schema.seed.json' with { type: 'json' };
import type fixture from '../../../migration/portfolio/fixture.json';

export type Portfolio = Omit<typeof fixture, 'projects' | 'sections'> & {
	sections: { id: string; headingId: string | null; title: string | null }[];
	projects: {
		id: string;
		title: string;
		category: string;
		accent: string;
		description: string;
		technologies: string[];
		url?: string;
		image?: { src: string; alt: string; fit?: string };
	}[];
};
export type PortfolioFailure = 'uninitialized' | 'invalid' | 'unavailable';
export class PortfolioUnavailableError extends Error {
	readonly code: PortfolioFailure;
	constructor(code: PortfolioFailure) {
		super('Portfolio is temporarily unavailable.');
		this.name = 'PortfolioUnavailableError';
		this.code = code;
	}
}

function invalid(): never {
	throw new PortfolioUnavailableError('invalid');
}
function object(value: unknown): Record<string, unknown> {
	if (!value || typeof value !== 'object' || Array.isArray(value)) invalid();
	return value as Record<string, unknown>;
}
function text(value: unknown): string {
	// Do not stringify JSON-looking text mistakenly decoded by EmDash 1.0.1.
	if (typeof value !== 'string' || !value.trim()) invalid();
	return value;
}
const unsafeUrlCharacters = (value: string) =>
	[...value].some(
		(character) =>
			character.charCodeAt(0) <= 32 || character.charCodeAt(0) === 127 || character === '\\'
	);
function link(value: unknown, email = false): string {
	const raw = text(value);
	if (unsafeUrlCharacters(raw)) invalid();
	let parsed: URL;
	try {
		parsed = new URL(raw);
	} catch {
		invalid();
	}
	if (parsed.username || parsed.password) invalid();
	if (email ? parsed.protocol !== 'mailto:' : parsed.protocol !== 'https:') invalid();
	return raw;
}
function repeat(value: unknown): string[] {
	if (!Array.isArray(value) || !value.length) invalid();
	return value.map((row) => text(object(row).value));
}
function image(value: unknown): { src: string; alt: string } {
	const media = object(value);
	text(media.id);
	const src = text(media.src);
	if (media.provider !== 'external' && media.provider !== 'local') invalid();
	if (src.startsWith('/')) {
		if (src.startsWith('//') || unsafeUrlCharacters(src) || /[?#%]/.test(src)) invalid();
		if (src.split('/').some((part) => part === '..' || part === '.')) invalid();
		if (media.provider === 'local' && !src.startsWith('/_emdash/api/media/file/')) invalid();
	} else {
		if (media.provider !== 'external') invalid();
		link(src);
	}
	return { src, alt: text(media.alt) };
}

/** Pure mapping boundary. The only non-CMS values are explicitly application-owned policy. */
export function assemblePortfolio(input: Record<string, unknown[]>): Portfolio {
	const ids: Record<string, string[]> = {
		portfolio_home: ['home'],
		portfolio_projects: application.projects.map((row) => row.id),
		portfolio_experience: application.experience,
		portfolio_education: application.education,
		portfolio_skill_groups: application.skillGroups,
		portfolio_contacts: application.contacts
	};
	const prefixes: Record<string, string> = {
		portfolio_home: 'portfolio-v1:',
		portfolio_projects: 'portfolio-v1:projects:',
		portfolio_experience: 'portfolio-v1:experience:',
		portfolio_education: 'portfolio-v1:education:',
		portfolio_skill_groups: 'portfolio-v1:skillGroups:',
		portfolio_contacts: 'portfolio-v1:contacts:'
	};
	const rows: Record<string, Record<string, unknown>[]> = {};
	for (const collection of schema.collections) {
		const list = input[collection.slug];
		if (!list?.length) throw new PortfolioUnavailableError('uninitialized');
		if (list.length < ids[collection.slug].length)
			throw new PortfolioUnavailableError('uninitialized');
		if (list.length !== ids[collection.slug].length) invalid();
		rows[collection.slug] = list
			.map(object)
			.sort((a, b) => Number(a.position) - Number(b.position));
		for (const [position, row] of rows[collection.slug].entries()) {
			const id = prefixes[collection.slug] + ids[collection.slug][position];
			if (row.id !== id || row.external_id !== id || row.position !== position) invalid();
			if (row.status !== 'published' || row.locale !== 'en') invalid();
			for (const field of collection.fields) {
				const value = row[field.slug];
				if (value === '' && !field.required) continue;
				if (value == null) {
					if (field.required) invalid();
					continue;
				}
				if (['string', 'text'].includes(field.type)) text(value);
				if (field.type === 'repeater') repeat(value);
			}
		}
	}
	const home = rows.portfolio_home[0];
	const name = text(home.name);
	const sectionFields: Record<string, string> = {
		projects: 'projects_heading',
		experience: 'experience_heading',
		education: 'education_heading',
		tech: 'skills_heading',
		contact: 'footer_heading'
	};
	return {
		schemaVersion: application.schemaVersion,
		site: { name, language: application.language, route: application.route },
		hero: {
			name,
			headline: text(home.headline),
			description: text(home.description),
			aside: text(home.aside),
			location: text(home.location),
			primaryAction: {
				label: text(home.primary_action_label),
				href: application.primaryActionHref
			},
			resumeAction: { label: text(home.resume_action_label), ...application.resumeAction }
		},
		sections: application.sections.map((section) => ({
			...section,
			title: section.id === 'top' ? null : text(home[sectionFields[section.id]])
		})),
		projects: rows.portfolio_projects.map((row, index) => {
			const { id, accent, fit } = application.projects[index];
			return {
				id,
				accent,
				title: text(row.title),
				category: text(row.category),
				description: text(row.description),
				technologies: repeat(row.technologies),
				...(row.url == null || row.url === '' ? {} : { url: link(row.url) }),
				...(row.image == null || row.image === ''
					? {}
					: { image: { ...image(row.image), ...(fit ? { fit } : {}) } })
			};
		}),
		experience: rows.portfolio_experience.map((row, index) => ({
			id: application.experience[index],
			date: text(row.date),
			role: text(row.role),
			company: text(row.company)
		})),
		education: rows.portfolio_education.map((row, index) => ({
			id: application.education[index],
			date: text(row.date),
			role: text(row.role),
			company: text(row.company)
		})),
		skillGroups: rows.portfolio_skill_groups.map((row, index) => ({
			id: application.skillGroups[index],
			label: text(row.label),
			items: repeat(row.items)
		})),
		contacts: rows.portfolio_contacts.map((row, index) => {
			const id = application.contacts[index];
			const url = link(row.url, id === 'email');
			if (id === 'email') {
				const address = text(row.address);
				if (!/^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(address) || url !== `mailto:${address}`)
					invalid();
				return { id, label: text(row.label), url, address };
			}
			if (row.address != null && row.address !== '') invalid();
			return { id, label: text(row.label), url };
		}),
		footer: {
			heading: text(home.footer_heading),
			description: text(home.footer_description),
			copyright: {
				prefix: application.footer.copyright.prefix,
				year: application.footer.copyright.year,
				suffix: application.footer.copyright.suffixTemplate.replace('{name}', name)
			},
			credit: application.footer.credit
		},
		seo: {
			...application.seo,
			title: text(home.seo_title),
			description: text(home.seo_description),
			openGraph: {
				...application.seo.openGraph,
				title: text(home.og_title),
				description: text(home.og_description)
			}
		},
		ui: {
			...structuredClone(application.ui),
			navigation: {
				...application.ui.navigation,
				homeLabel: application.ui.navigation.homeLabel.replace('{name}', name)
			}
		}
	};
}
