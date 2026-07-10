import prettier from 'eslint-config-prettier';
import path from 'node:path';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import { defineConfig, globalIgnores, includeIgnoreFile } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';

const gitignorePath = path.resolve(import.meta.dirname, '.gitignore');

export default defineConfig(
	includeIgnoreFile(gitignorePath),
	globalIgnores(['.agents/**', 'worker-configuration.d.ts']),
	js.configs.recommended,
	ts.configs.recommended,
	svelte.configs.recommended,
	prettier,
	svelte.configs.prettier,
	{
		languageOptions: { globals: { ...globals.browser, ...globals.node } },
		rules: {
			// typescript-eslint strongly recommend that you do not use the no-undef lint rule on TypeScript projects.
			// see: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
			'no-undef': 'off'
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser
			}
		}
	},
	{
		files: [
			'src/lib/components/InkLink.svelte',
			'src/lib/components/ProjectCard.svelte',
			'src/lib/components/SocialLink.svelte',
			'src/routes/+page.svelte'
		],
		rules: {
			// These components receive validated external URLs, not SvelteKit routes.
			'svelte/no-navigation-without-resolve': 'off'
		}
	},
	{
		files: ['src/lib/components/Timeline.svelte', 'src/routes/+page.svelte'],
		rules: {
			// Timeline HTML is trusted repository Markdown; JSON-LD is generated and escaped.
			'svelte/no-at-html-tags': 'off'
		}
	},
	{
		files: ['src/routes/+page.svelte'],
		rules: {
			// The Svelte parser treats application/ld+json contents as raw text.
			'@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: '^structuredDataJson$' }]
		}
	},
	{
		// Override or add rule settings here, such as:
		// 'svelte/button-has-type': 'error'
		rules: {}
	}
);
