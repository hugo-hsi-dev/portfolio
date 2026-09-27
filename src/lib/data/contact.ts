const emailAddress = 'hugohsidev@gmail.com';

export const email = {
	label: 'Email',
	address: emailAddress,
	url: `mailto:${emailAddress}`
} as const;

export const github = { label: 'GitHub', url: 'https://github.com/hugo-hsi-dev' } as const;
export const linkedin = { label: 'LinkedIn', url: 'https://www.linkedin.com/in/hugo-hsi' } as const;
export const contactLinks = [email, github, linkedin] as const;
