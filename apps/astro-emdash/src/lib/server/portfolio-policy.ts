import { definePlugin } from 'emdash';
import schema from '../../../migration/portfolio/schema.seed.json' with { type: 'json' };
import manifest from '../../../migration/portfolio/manifest.json' with { type: 'json' };

type Data = Record<string, unknown>;
const collections = new Map(schema.collections.map((collection) => [collection.slug, collection]));
const sourceGroups: Record<string, string> = {
	portfolio_home: 'home',
	portfolio_projects: 'projects',
	portfolio_experience: 'experience',
	portfolio_education: 'education',
	portfolio_skill_groups: 'skillGroups',
	portfolio_contacts: 'contacts'
};
const object = (value: unknown): value is Data =>
	typeof value === 'object' && value !== null && !Array.isArray(value);
const fail = (message: string): never => {
	throw new Error(`Portfolio content policy: ${message}`);
};

function identity(collection: string, id: unknown) {
	const prefix = `portfolio-v1:${sourceGroups[collection]}`;
	const record = manifest.records.find(
		(record) => record.externalId === id && (id === prefix || String(id).startsWith(`${prefix}:`))
	);
	if (!record) return fail('unknown migration identity');
	return record;
}

function webUrl(value: unknown): boolean {
	if (
		typeof value !== 'string' ||
		/[\s\\]/u.test(value) ||
		[...value].some((char) => char.charCodeAt(0) < 32)
	)
		return false;
	try {
		const url = new URL(value);
		return url.protocol === 'https:' && !url.username && !url.password;
	} catch {
		return false;
	}
}

/** Pure schema and immutable-identity boundary. Updates contain only changed fields. */
export function validatePortfolioData(
	collection: string,
	id: unknown,
	data: unknown,
	complete = false
): void {
	const definition = collections.get(collection);
	if (!definition) return;
	const record = identity(collection, id);
	if (!object(data)) return fail('content data must be an object');
	const fields = new Map(definition.fields.map((field) => [field.slug, field]));
	for (const key of Object.keys(data)) {
		if (!fields.has(key)) fail(`field ${key} is application-owned or unknown`);
	}
	for (const [key, expected] of Object.entries({
		external_id: record.externalId,
		position: record.position
	})) {
		if ((complete || key in data) && data[key] !== expected) fail(`${key} is immutable`);
	}
	for (const field of definition.fields) {
		if (!complete && !(field.slug in data)) continue;
		const value = data[field.slug];
		if (value == null || value === '') {
			if (field.required) fail(`${field.slug} is required`);
			continue;
		}
		if (field.type === 'string' || field.type === 'text') {
			if (typeof value !== 'string' || !value.trim()) fail(`${field.slug} must be text`);
			if (typeof value === 'string' && /^[{[]/u.test(value)) {
				let parsed = false;
				try {
					JSON.parse(value);
					parsed = true;
				} catch {
					/* Ordinary prose stays unchanged. */
				}
				if (parsed)
					fail(
						`${field.slug} cannot contain JSON-shaped text: EmDash 1.0.1 would decode it incorrectly on publication`
					);
			}
		}
		if (field.type === 'repeater') {
			if (
				!Array.isArray(value) ||
				value.length === 0 ||
				value.some(
					(row) =>
						!object(row) ||
						typeof row.value !== 'string' ||
						!row.value.trim() ||
						Object.keys(row).some((key) => key !== 'value')
				)
			)
				fail(`${field.slug} must contain ordered text values`);
		}
		if (
			field.type === 'url' &&
			!(collection === 'portfolio_contacts' && id === 'portfolio-v1:contacts:email')
		) {
			if (!webUrl(value)) fail(`${field.slug} must be an HTTPS URL without credentials`);
		}
		if (field.type === 'image') {
			if (
				!object(value) ||
				typeof value.id !== 'string' ||
				!value.id ||
				typeof value.alt !== 'string' ||
				!value.alt.trim()
			) {
				fail('image requires an identity and nonempty alt text');
			}
			if (!object(value)) continue;
			if (value.provider === 'external') {
				const staticAsset = manifest.media.some(
					(asset) =>
						asset.publicUrl === value.src &&
						value.id === `portfolio-v1:media:${asset.id}` &&
						asset.id.startsWith('project-')
				);
				if (!staticAsset) fail('external images must reference an inventoried project asset');
			} else if (value.provider === 'local' || value.provider === undefined) {
				if (
					value.src !== undefined &&
					(typeof value.src !== 'string' ||
						!/^\/_emdash\/api\/media\/(file|asset)\/[^?#\\]+$/u.test(value.src) ||
						value.src.includes('%') ||
						value.src.split('/').some((part) => part === '.' || part === '..'))
				) {
					fail('local image source must use the CMS media endpoint');
				}
			} else fail('unsupported media provider');
		}
	}
	if (collection === 'portfolio_contacts') {
		if (id === 'portfolio-v1:contacts:email') {
			if (complete || 'address' in data) {
				if (
					typeof data.address !== 'string' ||
					!/^[A-Za-z0-9._+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/u.test(data.address)
				)
					fail('invalid email address');
			}
			if (
				'url' in data &&
				(typeof data.url !== 'string' ||
					!/^mailto:[A-Za-z0-9._+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/u.test(data.url))
			)
				fail('invalid email URL');
			if (complete && data.url !== `mailto:${data.address}`)
				fail('email address and mailto URL must agree');
		} else if (data.address != null && data.address !== '')
			fail('only the email contact may have an address');
	}
}

/** API-created records are intentionally disabled; the reviewed seed owns initial identities. */
export function validatePortfolioSave(event: {
	collection: string;
	isNew: boolean;
	id?: string;
	content: Data;
}): void {
	if (!collections.has(event.collection)) return;
	if (event.isNew) fail('create portfolio records through the reviewed import');
	validatePortfolioData(event.collection, event.id, event.content);
}

const publicationPolicy = async (
	event: { collection: string; content: Data },
	ctx: { media?: { get(id: string): Promise<{ mimeType: string } | null> } }
) => {
	if (!collections.has(event.collection)) return;
	validatePortfolioData(event.collection, event.content.id, event.content.data, true);
	if (event.content.locale !== 'en' || (event.content.slug !== null && event.content.slug !== ''))
		fail('portfolio locale and slug are application-owned');
	const data = event.content.data as Data;
	const image = data.image;
	if (object(image) && image.provider !== 'external') {
		const media = await ctx.media?.get(String(image.id));
		if (!media || !media.mimeType.startsWith('image/'))
			fail('local image must reference ready CMS image media');
	}
};

/** Native EmDash 1.0.1 hooks; direct seed/repository calls are outside this boundary. */
export const portfolioPolicy = definePlugin({
	id: 'portfolio-content-policy',
	version: '1.0.0',
	capabilities: ['content:read', 'content:write', 'media:read', 'hooks.content-policy:register'],
	hooks: {
		'content:beforeSave': {
			errorPolicy: 'abort',
			handler: async (event) => validatePortfolioSave(event)
		},
		'content:beforeDelete': {
			errorPolicy: 'abort',
			handler: async (event) => !collections.has(event.collection)
		},
		'content:beforePublish': { errorPolicy: 'abort', handler: publicationPolicy },
		'content:beforeSchedule': { errorPolicy: 'abort', handler: publicationPolicy }
	}
});

/** Native integration entrypoint; recreated inside the Worker, never serialized as callbacks. */
export const createPlugin = () => portfolioPolicy;
