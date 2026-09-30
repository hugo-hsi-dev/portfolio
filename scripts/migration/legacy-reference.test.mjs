import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import test from 'node:test';
import {
	assertNoLegacyEnvironmentFiles,
	isOutsideDirectory,
	legacySourceSHA,
	rendererIdentity,
	runLocalCommand,
	screenshotNames,
	validateLegacyReference
} from './legacy-reference.mjs';

test('legacy capture rejects environment variants and inside paths named with two dots', async () => {
	const root = await mkdtemp(resolve(tmpdir(), 'portfolio-reference-environment-'));
	try {
		await writeFile(resolve(root, '.env.example'), 'fixture');
		await assertNoLegacyEnvironmentFiles(root, ['.env.example']);
		for (const name of ['.env', '.env.production', '.dev.vars', '.dev.vars.local']) {
			await writeFile(resolve(root, name), 'fixture');
			await assert.rejects(
				assertNoLegacyEnvironmentFiles(root, ['.env.example']),
				/local environment files/
			);
			await rm(resolve(root, name));
		}
		assert.equal(isOutsideDirectory(root, resolve(root, '..evidence')), false);
		assert.equal(isOutsideDirectory(root, root), false);
		assert.equal(isOutsideDirectory(root, resolve(root, '..')), true);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test('interrupted bounded subprocess is rejected and its process group exits', async () => {
	const root = await mkdtemp(resolve(tmpdir(), 'portfolio-reference-abort-'));
	const controller = new AbortController();
	const pidFile = resolve(root, 'pid');
	const pending = runLocalCommand(
		process.execPath,
		[
			'-e',
			'const fs=require("node:fs");fs.writeFileSync(process.argv[1],String(process.pid));setInterval(()=>{},1000)',
			pidFile
		],
		undefined,
		10_000,
		undefined,
		controller.signal
	);
	try {
		let pid;
		for (let i = 0; i < 100; i++) {
			try {
				pid = Number(await readFile(pidFile, 'utf8'));
				break;
			} catch {
				await new Promise((done) => setTimeout(done, 10));
			}
		}
		assert.ok(pid, 'Subprocess must start before cancellation');
		controller.abort(new Error('test cancellation'));
		await assert.rejects(pending, /test cancellation/);
		let exited = false;
		for (let i = 0; i < 100; i++) {
			try {
				process.kill(pid, 0);
			} catch (error) {
				assert.equal(error.code, 'ESRCH');
				exited = true;
				break;
			}
			await new Promise((done) => setTimeout(done, 10));
		}
		assert.ok(exited, 'Cancelled subprocess must not survive');
	} finally {
		controller.abort(new Error('test cleanup'));
		await pending.catch(() => {});
		await rm(root, { recursive: true, force: true });
	}
});

test('reference override rejects altered source, renderer and image provenance', async () => {
	const root = await mkdtemp(resolve(tmpdir(), 'portfolio-reference-provenance-'));
	try {
		const images = {};
		for (const name of screenshotNames) {
			// This tests byte provenance without requiring a browser or Pillow at check time.
			const bytes = Buffer.from(`immutable-test-image:${name}`);
			await writeFile(resolve(root, name), bytes);
			images[name] = { sha256: createHash('sha256').update(bytes).digest('hex') };
		}
		const manifest = {
			version: 1,
			source: {
				sha: legacySourceSHA,
				tree: '55ab3a5f5e75f1baa44d48580b2a584ec2faac46',
				clean: true
			},
			// Node's executable/version gives this native test a stable renderer identity
			// stand-in; real capture always launches the supplied Chromium via Playwright.
			renderer: await rendererIdentity(process.execPath),
			images
		};
		const save = () =>
			writeFile(resolve(root, 'reference-manifest.json'), JSON.stringify(manifest));
		await save();
		assert.deepEqual(await validateLegacyReference(root, process.execPath), manifest);
		manifest.source.sha = '0'.repeat(40);
		await save();
		await assert.rejects(validateLegacyReference(root, process.execPath), {
			code: 'ERR_ASSERTION'
		});
		manifest.source.sha = legacySourceSHA;
		manifest.renderer.browser.version = 'another-renderer';
		await save();
		await assert.rejects(
			validateLegacyReference(root, process.execPath),
			/Reference renderer must match/
		);
		manifest.renderer = await rendererIdentity(process.execPath);
		await save();
		await writeFile(resolve(root, screenshotNames[0]), 'changed image');
		await assert.rejects(
			validateLegacyReference(root, process.execPath),
			/Reference image hash mismatch/
		);
		assert.ok(
			(await readFile(resolve(root, 'reference-manifest.json'), 'utf8')).includes(legacySourceSHA)
		);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});
