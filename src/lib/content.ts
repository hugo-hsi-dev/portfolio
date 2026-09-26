import { asset } from '$app/paths';

export const links = {
	email: 'mailto:hugohsidev@gmail.com',
	emailAddress: 'hugohsidev@gmail.com',
	github: 'https://github.com/hugo-hsi-dev',
	linkedin: 'https://www.linkedin.com/in/hugo-hsi'
};

export const headline = 'Engineering products from design to database.';

export type Project = {
	title: string;
	category: string;
	kind: 'client' | 'personal';
	description: string;
	technologies: string[];
	url?: string;
	image?: { src: string; alt: string; fit?: 'cover' | 'contain' };
};

export const projects: Project[] = [
	{
		title: 'Windows & PC Hardware',
		category: 'Personal desktops and laptops',
		kind: 'personal',
		description:
			'Assembled a gaming desktop and installed Windows on personal desktops and laptops. Configured and updated BIOS, installed applications with winget and Scoop, and customized registry settings using technical guides.',
		technologies: ['Windows', 'PC assembly', 'BIOS', 'winget', 'Scoop']
	},
	{
		title: 'Arch Linux',
		category: 'Personal development laptop',
		kind: 'personal',
		description:
			'Explored Ubuntu, Fedora, and Zorin before choosing Arch for an aging laptop with battery and performance issues. Installed Arch using its documentation, managed packages with pacman, tested Hyprland and Niri, and maintained the system through updates and configuration cleanup.',
		technologies: ['Arch Linux', 'pacman', 'Hyprland', 'Niri']
	},
	{
		title: 'National Medal of Honor Museum',
		category: 'Client work at Praxis Loop',
		kind: 'client',
		description:
			'Wrote migration scripts to move 3,500 pages from WordPress to Prismic, and built automated visual checks with Playwright and GitHub Actions to catch unintended layout changes.',
		technologies: ['WordPress', 'Prismic', 'Playwright', 'GitHub Actions'],
		url: 'https://mohmuseum.org/',
		image: { src: asset('/projects/museum.png'), alt: 'National Medal of Honor Museum website' }
	},
	{
		title: '1st Avenue Advisors',
		category: 'Client work at Praxis Loop',
		kind: 'client',
		description:
			'Translated Figma designs into responsive Next.js and Tailwind components, connecting frontend forms with backend mailing services.',
		technologies: ['Next.js', 'Tailwind CSS', 'shadcn/ui'],
		url: 'https://www.1staveadvisors.com/',
		image: {
			src: asset('/projects/advisors.png'),
			alt: '1st Avenue Advisors official Open Graph logo',
			fit: 'contain'
		}
	},
	{
		title: 'MineCentral',
		category: 'Personal project',
		kind: 'personal',
		description:
			'Built and maintained a Minecraft server hosting platform with Next.js and self-hosted server management tools. Connected Stripe subscriptions to server provisioning and a dashboard for billing and instance monitoring.',
		technologies: ['Next.js', 'Stripe', 'Coolify'],
		url: 'https://www.minecentral.net/',
		image: {
			src: asset('/projects/minecentral.png'),
			alt: 'MineCentral Minecraft server hosting website'
		}
	}
];

export type TimelineEntry = { date: string; title: string; organization: string };

export const experience: TimelineEntry[] = [
	{ date: '2025 — Present', title: 'Full Stack Developer', organization: 'Praxis Loop' },
	{ date: '2022 — 2023', title: 'Production Designer', organization: 'Lookout' },
	{ date: '2021 — Present', title: 'Badminton Head Coach', organization: 'Reflex' }
];

export const education: TimelineEntry[] = [
	{
		date: '2024',
		title: 'Full Stack Web Development Bootcamp',
		organization: 'Columbia University'
	},
	{
		date: '2023',
		title: 'Bachelor of Fine Arts in Communication Design',
		organization: 'The New School'
	}
];

export type SkillGroup = { label: string; items: string[] };

export const skills: SkillGroup[] = [
	{
		label: 'Systems & Hardware',
		items: [
			'Windows installation and configuration',
			'Arch Linux',
			'WSL',
			'PC assembly',
			'BIOS updates'
		]
	},
	{
		label: 'Web & Tools',
		items: [
			'WordPress',
			'Prismic',
			'REST APIs',
			'Postman',
			'Insomnia',
			'Git',
			'GitHub',
			'Vercel',
			'Coolify'
		]
	},
	{
		label: 'Development',
		items: [
			'PostgreSQL',
			'SQLite',
			'SQL',
			'JavaScript',
			'TypeScript',
			'HTML',
			'CSS',
			'GitHub Actions',
			'Playwright'
		]
	}
];
