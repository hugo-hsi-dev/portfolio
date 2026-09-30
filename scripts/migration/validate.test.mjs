import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { appRoot, validateLocalConfig, validateEnvFiles } from './validate.mjs';

const localConfig = () => JSON.parse(readFileSync(resolve(appRoot, 'wrangler.jsonc'), 'utf8'));

test('local configuration accepts isolated emulated resources', () => {
	assert.doesNotThrow(() => validateLocalConfig(localConfig(), {}));
});

test('cloud environment or resource changes cannot enter foundation checks unnoticed', () => {
	assert.throws(() => validateLocalConfig(localConfig(), { CLOUDFLARE_ENV: 'production' }));
	for (const change of [
		(config) => (config.name = 'portfolio'),
		(config) => (config.r2_buckets[0].remote = true),
		(config) => (config.d1_databases[0].database_id = 'actual-resource'),
		(config) => (config.routes = [{ pattern: 'hugohsi.dev', custom_domain: true }]),
		(config) => (config.workers_dev = true),
		(config) => (config.env = { production: {} })
	]) {
		const config = localConfig();
		change(config);
		assert.throws(() => validateLocalConfig(config, {}));
	}
});

test('conflicting runtime env files fail without reading secret values', () => {
	assert.doesNotThrow(() => validateEnvFiles(['.dev.vars']));
	assert.doesNotThrow(() => validateEnvFiles(['.env.local']));
	assert.throws(() => validateEnvFiles(['.dev.vars', '.env.local']));
});
