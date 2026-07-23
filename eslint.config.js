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
			'src/lib/features/portfolio-board/components/BoardTopbar.svelte',
			'src/lib/features/portfolio-board/components/BrowseDialog.svelte'
		],
		rules: {
			// These components receive validated external URLs, not SvelteKit routes.
			'svelte/no-navigation-without-resolve': 'off'
		}
	},
	{
		files: ['src/lib/features/portfolio-board/components/PortfolioSeo.svelte'],
		rules: {
			// JSON-LD is generated from validated content and escapes "<" before injection.
			'svelte/no-at-html-tags': 'off',
			// The Svelte parser does not expose identifiers referenced only by the raw JSON-LD block.
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					varsIgnorePattern: '^(buildStructuredDataJson|projects|technologies|structuredDataJson)$'
				}
			]
		}
	},
	{
		// Override or add rule settings here, such as:
		// 'svelte/button-has-type': 'error'
		rules: {}
	}
);
