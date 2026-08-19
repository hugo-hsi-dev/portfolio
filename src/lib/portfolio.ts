export type TraceStageId = 'found' | 'built' | 'changed';

export interface TraceStage {
	id: TraceStageId;
	label: string;
	text: string;
}

export interface ProjectStory {
	slug: string;
	title: string;
	context: string;
	period: string;
	summary: string;
	image: string;
	imageAlt: string;
	liveUrl: string;
	technologies: readonly string[];
	stages: readonly TraceStage[];
}

export interface ExperienceItem {
	period: string;
	company: string;
	role: string;
	summary: string;
}

export const projects = [
	{
		slug: 'national-medal-of-honor-museum',
		title: 'National Medal of Honor Museum',
		context: 'Client work · Praxis Loop',
		period: '2025–2026',
		summary: 'A 3,500+ page CMS migration that became a question of who gets to control the site.',
		image: '/media/projects/national-medal-of-honor-museum/hero.jpg',
		imageAlt: 'National Medal of Honor Museum website showing the museum building at night',
		liveUrl: 'https://mohmuseum.org/',
		technologies: ['Next.js', 'Prismic', 'Tailwind CSS'],
		stages: [
			{
				id: 'found',
				label: 'What I found',
				text: 'The costly part was not just WordPress. Everyday publishing changes still depended on developers.'
			},
			{
				id: 'built',
				label: 'What I built',
				text: 'Editor-friendly Prismic models and a custom Next.js frontend, migrated solo across more than 3,500 pages.'
			},
			{
				id: 'changed',
				label: 'What changed',
				text: 'The museum team gained more control of publishing and relied less on paid development.'
			}
		]
	},
	{
		slug: 'minecentral',
		title: 'MineCentral',
		context: 'Personal product',
		period: '2024–2025',
		summary:
			'Minecraft hosting treated as one connected product—not a collection of admin screens.',
		image: '/media/projects/minecentral/hero.jpg',
		imageAlt: 'MineCentral website showing its Minecraft server hosting product',
		liveUrl: 'https://www.minecentral.net/',
		technologies: ['Next.js', 'Stripe', 'Pterodactyl'],
		stages: [
			{
				id: 'found',
				label: 'What I found',
				text: 'Provisioning, subscriptions, and live server state had to behave like one experience.'
			},
			{
				id: 'built',
				label: 'What I built',
				text: 'A full-stack platform connecting Stripe billing to Pterodactyl server management.'
			},
			{
				id: 'changed',
				label: 'What changed',
				text: 'Users can create, pay for, manage, and monitor their servers in one place.'
			}
		]
	},
	{
		slug: 'first-avenue-advisors',
		title: '1st Avenue Advisors',
		context: 'Client work · Praxis Loop',
		period: '2025',
		summary: 'High-fidelity interface work carried all the way into the system behind its forms.',
		image: '/media/projects/1st-avenue-advisors/hero.jpg',
		imageAlt: '1st Avenue Advisors website with its Decades of Experience headline',
		liveUrl: 'https://www.1staveadvisors.com/',
		technologies: ['Next.js', 'Tailwind CSS', 'Mailing services'],
		stages: [
			{
				id: 'found',
				label: 'What I found',
				text: 'Visual fidelity would mean little if the inquiry flows failed at the handoff to business operations.'
			},
			{
				id: 'built',
				label: 'What I built',
				text: 'Responsive components and complex frontend forms integrated with backend mailing services.'
			},
			{
				id: 'changed',
				label: 'What changed',
				text: 'The live experience carries the design intent through every breakpoint and every form submission.'
			}
		]
	}
] as const satisfies readonly ProjectStory[];

export const principles = [
	{
		title: 'Find the meaningful constraint',
		text: 'Start with the people, content, and consequences around the request—not only the requested screen.'
	},
	{
		title: 'Build at the right layer',
		text: 'The answer might be a component, content model, application, testing pipeline, or production workflow.'
	},
	{
		title: 'Leave the next change easier',
		text: 'Build systems that editors, teammates, and users can continue to operate and extend.'
	}
] as const;

export const experience = [
	{
		period: '2025–Now',
		company: 'Praxis Loop',
		role: 'Full Stack Developer',
		summary:
			'CMS migrations, design-system consolidation, visual regression tooling, and AI-assisted development workflows.'
	},
	{
		period: '2022–2023',
		company: 'Lookout',
		role: 'Design Production',
		summary:
			'Brought motion production in-house and built reusable brand assets; work was recognized with a GDUSA American Inhouse Design Award.'
	}
] as const satisfies readonly ExperienceItem[];

export const contact = {
	email: 'hugohsidev@gmail.com',
	github: 'https://github.com/hugohsi-dev',
	linkedin: 'https://www.linkedin.com/in/hugo-hsi/',
	resume: '/media/resume/resume_hugo-hsi.pdf'
} as const;
