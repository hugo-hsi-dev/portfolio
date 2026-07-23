import { z } from 'zod';

const nonEmptyString = z.string().trim().min(1, 'must be a non-empty string');

const optional = <T extends z.ZodType>(schema: T) =>
	z.preprocess((value) => (value === null ? undefined : value), schema.optional());

const uniqueStrings = z.array(nonEmptyString).superRefine((values, context) => {
	if (new Set(values).size !== values.length) {
		context.addIssue({
			code: 'custom',
			message: 'must not contain duplicates'
		});
	}
});

const webUrl = nonEmptyString.refine((value) => {
	try {
		const url = new URL(value);
		return url.protocol === 'http:' || url.protocol === 'https:';
	} catch {
		return false;
	}
}, 'must be an http or https URL');

const link = nonEmptyString.refine(
	(value) => value.startsWith('/') || value.startsWith('#') || webUrl.safeParse(value).success,
	'must be a relative link, anchor, or http/https URL'
);

const mediaPath = (extensions: readonly string[]) =>
	nonEmptyString.superRefine((value, context) => {
		if (!value.startsWith('/media/') || value.includes('..')) {
			context.addIssue({
				code: 'custom',
				message: 'must be an absolute /media/ path without traversal'
			});
		}

		const lowercaseValue = value.toLowerCase();
		if (!extensions.some((extension) => lowercaseValue.endsWith(extension))) {
			context.addIssue({
				code: 'custom',
				message: `must end with ${extensions.join(', ')}`
			});
		}
	});

const calendarDate = nonEmptyString.refine((value) => {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

	const parsed = new Date(`${value}T00:00:00.000Z`);
	return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, 'must be a valid YYYY-MM-DD date');

const datePrecision = z.enum(['month', 'year']);

export const siteContentSchema = z.strictObject({
	hero: z.strictObject({
		firstName: nonEmptyString,
		lastName: nonEmptyString,
		tagline: nonEmptyString,
		intro: optional(nonEmptyString),
		ctaPrimary: z.strictObject({
			text: nonEmptyString,
			link
		}),
		ctaSecondary: optional(
			z.strictObject({
				text: nonEmptyString
			})
		),
		quote: optional(nonEmptyString)
	}),
	contact: z.strictObject({
		email: nonEmptyString.email('must be a valid email address'),
		github: optional(webUrl),
		linkedin: optional(webUrl)
	}),
	footer: z.strictObject({
		heading: nonEmptyString,
		intro: nonEmptyString,
		builtWith: nonEmptyString
	}),
	seo: z.strictObject({
		title: nonEmptyString,
		description: nonEmptyString,
		canonicalUrl: webUrl,
		image: mediaPath(['.jpg', '.jpeg', '.png']),
		imageAlt: nonEmptyString,
		keywords: uniqueStrings,
		themeColor: nonEmptyString.regex(/^#[\da-f]{6}$/i, 'must be a six-digit hex color'),
		jobTitle: nonEmptyString
	}),
	resumeUrl: optional(mediaPath(['.pdf']))
});

export const projectContentSchema = z
	.strictObject({
		title: nonEmptyString,
		excerpt: nonEmptyString,
		context: z.enum(['personal', 'work']),
		company: optional(nonEmptyString),
		order: z.number().int('must be an integer').nonnegative('must be a non-negative integer'),
		liveUrl: optional(webUrl),
		featuredImage: optional(mediaPath(['.jpg', '.jpeg', '.png', '.webp', '.avif'])),
		featuredImageAlt: optional(nonEmptyString),
		technologies: uniqueStrings
	})
	.superRefine((project, context) => {
		if (project.context === 'work' && !project.company) {
			context.addIssue({
				code: 'custom',
				path: ['company'],
				message: 'is required when context is "work"'
			});
		}

		if (project.featuredImage && !project.featuredImageAlt) {
			context.addIssue({
				code: 'custom',
				path: ['featuredImageAlt'],
				message: 'is required when featuredImage is set'
			});
		}

		if (!project.featuredImage && project.featuredImageAlt) {
			context.addIssue({
				code: 'custom',
				path: ['featuredImageAlt'],
				message: 'requires featuredImage'
			});
		}
	});

export const experienceContentSchema = z
	.strictObject({
		company: nonEmptyString,
		role: nonEmptyString,
		startDate: calendarDate,
		startDatePrecision: optional(datePrecision),
		endDate: optional(calendarDate),
		endDatePrecision: optional(datePrecision),
		isCurrent: optional(z.boolean()),
		highlights: uniqueStrings.min(1, 'must contain at least one highlight')
	})
	.superRefine((experience, context) => {
		if (experience.endDate && experience.endDate < experience.startDate) {
			context.addIssue({
				code: 'custom',
				path: ['endDate'],
				message: 'must not be before startDate'
			});
		}

		if (experience.isCurrent && experience.endDate) {
			context.addIssue({
				code: 'custom',
				path: ['endDate'],
				message: 'must be omitted when isCurrent is true'
			});
		}

		if (experience.isCurrent && experience.endDatePrecision) {
			context.addIssue({
				code: 'custom',
				path: ['endDatePrecision'],
				message: 'must be omitted when isCurrent is true'
			});
		}

		if (!experience.endDate && experience.endDatePrecision) {
			context.addIssue({
				code: 'custom',
				path: ['endDatePrecision'],
				message: 'requires endDate'
			});
		}

		if (!experience.isCurrent && !experience.endDate) {
			context.addIssue({
				code: 'custom',
				path: ['endDate'],
				message: 'is required when isCurrent is false or omitted'
			});
		}
	});

export const educationContentSchema = z.strictObject({
	institution: nonEmptyString,
	degree: nonEmptyString,
	completionDate: calendarDate,
	datePrecision: optional(datePrecision)
});

export const technologiesContentSchema = z.strictObject({
	frontend: uniqueStrings,
	backend: uniqueStrings,
	database: uniqueStrings,
	tools: uniqueStrings
});

export type SiteContent = z.infer<typeof siteContentSchema>;
export type ProjectContent = z.infer<typeof projectContentSchema>;
export type ExperienceContent = z.infer<typeof experienceContentSchema>;
export type EducationContent = z.infer<typeof educationContentSchema>;
export type TechnologiesContent = z.infer<typeof technologiesContentSchema>;
export type ProjectContext = ProjectContent['context'];
export type DatePrecision = NonNullable<ExperienceContent['startDatePrecision']>;
export type TechnologyCategory = keyof TechnologiesContent;
