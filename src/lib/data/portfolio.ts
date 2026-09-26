import { asset } from '$app/paths';

export interface Project {
	title: string;
	category: string;
	accent: 'gold' | 'sage';
	description: string;
	technologies: string[];
	url: string;
	image: string;
	imageFit?: 'logo';
	alt: string;
}

export interface TimelineEntry {
	date: string;
	role: string;
	company: string;
}

export const projects: Project[] = [
	{
		title: 'Windows & PC Hardware',
		category: 'Personal desktops and laptops',
		accent: 'sage',
		description:
			'Assembled a gaming desktop and installed Windows on personal desktops and laptops. Configured and updated BIOS, installed applications with winget and Scoop, and customized registry settings using technical guides.',
		technologies: ['Windows', 'PC assembly', 'BIOS', 'winget', 'Scoop'],
		url: '',
		image: '',
		alt: ''
	},
	{
		title: 'Arch Linux',
		category: 'Personal development laptop',
		accent: 'sage',
		description:
			'Explored Ubuntu, Fedora, and Zorin before choosing Arch for an aging laptop with battery and performance issues. Installed Arch using its documentation, managed packages with pacman, tested Hyprland and Niri, and maintained the system through updates and configuration cleanup.',
		technologies: ['Arch Linux', 'pacman', 'Hyprland', 'Niri'],
		url: '',
		image: '',
		alt: ''
	},
	{
		title: 'National Medal of Honor Museum',
		category: 'Client work at Praxis Loop',
		accent: 'gold',
		description:
			'Wrote migration scripts to move 3,500 pages from WordPress to Prismic, and built automated visual checks with Playwright and GitHub Actions to catch unintended layout changes.',
		technologies: ['WordPress', 'Prismic', 'Playwright', 'GitHub Actions'],
		url: 'https://mohmuseum.org/',
		image: asset('/projects/museum.png'),
		alt: 'National Medal of Honor Museum website'
	},
	{
		title: '1st Avenue Advisors',
		category: 'Client work at Praxis Loop',
		accent: 'gold',
		description:
			'Translated Figma designs into responsive Next.js and Tailwind components, connecting frontend forms with backend mailing services.',
		technologies: ['Next.js', 'Tailwind CSS', 'shadcn/ui'],
		url: 'https://www.1staveadvisors.com/',
		image: asset('/projects/advisors.png'),
		imageFit: 'logo',
		alt: '1st Avenue Advisors official Open Graph logo'
	},
	{
		title: 'MineCentral',
		category: 'Personal project',
		accent: 'sage',
		description:
			'Built and maintained a Minecraft server hosting platform with Next.js and self-hosted server management tools. Connected Stripe subscriptions to server provisioning and a dashboard for billing and instance monitoring.',
		technologies: ['Next.js', 'Stripe', 'Coolify'],
		url: 'https://www.minecentral.net/',
		image: asset('/projects/minecentral.png'),
		alt: 'MineCentral Minecraft server hosting website'
	}
];

export const experience: TimelineEntry[] = [
	{
		date: '2025 — Present',
		role: 'Full Stack Developer',
		company: 'Praxis Loop'
	},
	{
		date: '2022 — 2023',
		role: 'Production Designer',
		company: 'Lookout'
	},
	{
		date: '2021 — Present',
		role: 'Badminton Head Coach',
		company: 'Reflex'
	}
];

export const technologies = [
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
export const education: TimelineEntry[] = [
	{ date: '2024', role: 'Full Stack Web Development Bootcamp', company: 'Columbia University' },
	{ date: '2023', role: 'Bachelor of Fine Arts in Communication Design', company: 'The New School' }
];
