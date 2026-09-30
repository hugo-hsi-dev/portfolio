import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import { d1, r2 } from '@emdash-cms/cloudflare';
import { defineConfig } from 'astro/config';
import emdash from 'emdash/astro';
import { fileURLToPath } from 'node:url';

export default defineConfig({
	output: 'server',
	adapter: cloudflare({ imageService: 'passthrough' }),
	integrations: [
		react(),
		emdash({
			// Keep CMS builds independent of Google font metadata; public fonts are UI-owned.
			fonts: false,
			database: d1({ binding: 'DB' }),
			storage: r2({ binding: 'MEDIA' }),
			plugins: [
				{
					id: 'portfolio-content-policy',
					version: '1.0.0',
					entrypoint: fileURLToPath(
						new URL('./src/lib/server/portfolio-policy.ts', import.meta.url)
					)
				}
			]
		})
	],
	devToolbar: { enabled: false }
});
