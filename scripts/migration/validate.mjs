import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export const appRoot = fileURLToPath(new URL('../../apps/astro-emdash/', import.meta.url));

export function validateLocalConfig(config, environment = process.env) {
	if (environment.CLOUDFLARE_ENV)
		throw new Error('Foundation commands require the local environment.');
	if (config.name !== 'portfolio-astro-emdash-local')
		throw new Error('Expected isolated Worker name.');
	if (config.routes?.length || config.env || config.account_id || config.worker_loaders?.length) {
		throw new Error('Cloud targets and plugin loaders require a separate reviewed configuration.');
	}
	if (config.workers_dev !== false || config.preview_urls !== false) {
		throw new Error('Foundation configuration must disable public Worker URLs.');
	}
	for (const binding of [
		...config.d1_databases,
		...config.r2_buckets,
		...(config.kv_namespaces ?? [])
	]) {
		if (binding.remote !== false)
			throw new Error('All declared resources must use local emulation.');
	}
	if (
		config.d1_databases.length !== 1 ||
		config.d1_databases[0].binding !== 'DB' ||
		config.d1_databases[0].database_id !== '00000000-0000-0000-0000-000000000000' ||
		config.r2_buckets.length !== 1 ||
		config.r2_buckets[0].binding !== 'MEDIA' ||
		config.r2_buckets[0].bucket_name !== 'portfolio-astro-emdash-media-local' ||
		config.kv_namespaces?.length !== 1 ||
		config.kv_namespaces[0].binding !== 'SESSION' ||
		config.kv_namespaces[0].id !== '00000000000000000000000000000000'
	) {
		throw new Error('Expected local DB, MEDIA and SESSION placeholders.');
	}
}

export function validateEnvFiles(files) {
	const vars = files.filter((name) => name === '.dev.vars' || name.startsWith('.dev.vars.'));
	const env = files.filter((name) => name === '.env' || name.startsWith('.env.'));
	if (vars.length && env.length) throw new Error('Choose .dev.vars or .env, never both.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const { readdirSync } = await import('node:fs');
	const config = JSON.parse(readFileSync(resolve(appRoot, 'wrangler.jsonc'), 'utf8'));
	validateLocalConfig(config);
	validateEnvFiles(readdirSync(appRoot).filter((name) => !name.endsWith('.example')));
	const rootPackage = JSON.parse(
		readFileSync(new URL('../../package.json', import.meta.url), 'utf8')
	);
	if (!process.version.startsWith('v24.')) throw new Error('Use Node.js 24.');
	if (rootPackage.packageManager !== 'pnpm@11.22.0') throw new Error('Expected pnpm 11.22.0.');
	if (!existsSync(resolve(appRoot, 'node_modules')))
		throw new Error('Run pnpm migration:bootstrap.');
	console.log('Local migration configuration validated; no secret values read.');
}
