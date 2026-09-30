import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { arch, platform, release, tmpdir } from 'node:os';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const legacySourceSHA = '326c112c709f93bba6fb4701d03870383a316424';
const legacyTreeSHA = '55ab3a5f5e75f1baa44d48580b2a584ec2faac46';
export const screenshotNames = [
	'astro-375.png',
	'astro-768.png',
	'astro-1440.png',
	'astro-375-nojs.png'
];
export const captureContract = {
	viewports: [
		[375, 812, false],
		[768, 1024, false],
		[1440, 1000, false],
		[375, 812, true]
	],
	reducedMotion: 'reduce',
	fullPage: true,
	navigation: 'networkidle',
	fonts: 'document.fonts.ready',
	scrollStep: 'height / 2 rounded down',
	scrollDelayMs: 40,
	settledDelayMs: 100,
	browserArgs: ['--no-sandbox', '--no-proxy-server']
};
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

function commandEnvironment(home) {
	const env = {};
	for (const name of [
		'PATH',
		'PNPM_HOME',
		'COREPACK_HOME',
		'PNPM_CONFIG_STORE_DIR',
		'PNPM_CONFIG_ENABLE_GLOBAL_VIRTUAL_STORE',
		'LANG',
		'LC_ALL',
		'TZ',
		'TMPDIR',
		'CI'
	]) {
		if (process.env[name] !== undefined) env[name] = process.env[name];
	}
	if (home) {
		env.HOME = home;
		env.XDG_CONFIG_HOME = resolve(home, 'config');
		env.XDG_CACHE_HOME = resolve(home, 'cache');
	}
	return { ...env, CLOUDFLARE_CF_FETCH_ENABLED: 'false', WRANGLER_SEND_METRICS: 'false' };
}

function signalGroup(pid, signal) {
	try {
		process.kill(-pid, signal);
	} catch (error) {
		if (error.code !== 'ESRCH') throw error;
	}
}

export function runLocalCommand(
	command,
	args,
	cwd,
	timeout = 90_000,
	env = commandEnvironment(),
	signal
) {
	return new Promise((done, reject) => {
		if (signal?.aborted) {
			reject(signal.reason);
			return;
		}
		const child = spawn(command, args, {
			cwd,
			env,
			detached: true,
			stdio: ['ignore', 'pipe', 'pipe']
		});
		let stdout = '';
		let stderr = '';
		const timer = setTimeout(() => {
			if (child.pid) signalGroup(child.pid, 'SIGKILL');
			signal?.removeEventListener('abort', abort);
			reject(new Error(`${command} timed out after ${timeout}ms`));
		}, timeout);
		const abort = () => {
			clearTimeout(timer);
			if (child.pid) signalGroup(child.pid, 'SIGKILL');
			reject(signal.reason);
		};
		signal?.addEventListener('abort', abort, { once: true });
		child.stdout.on('data', (data) => (stdout += data));
		child.stderr.on('data', (data) => (stderr += data));
		child.once('error', (error) => {
			clearTimeout(timer);
			signal?.removeEventListener('abort', abort);
			reject(error);
		});
		child.once('exit', (code) => {
			clearTimeout(timer);
			signal?.removeEventListener('abort', abort);
			if (code !== 0) reject(new Error(`${command} failed (${code}): ${stderr}\n${stdout}`));
			else done(stdout.trim());
		});
	});
}

const run = runLocalCommand;

export async function rendererIdentity(browserPath, signal) {
	assert.ok(isAbsolute(browserPath), 'Browser path must be absolute');
	const executable = await realpath(browserPath);
	let osRelease = '';
	if (platform() === 'linux') osRelease = await readFile('/etc/os-release', 'utf8');
	return {
		browser: {
			executable,
			sha256: sha256(await readFile(executable)),
			version: await run(executable, ['--version'], undefined, 90_000, undefined, signal)
		},
		os: { platform: platform(), arch: arch(), release: release(), distribution: osRelease },
		locale: {
			lang: process.env.LANG ?? null,
			lcAll: process.env.LC_ALL ?? null,
			tz: process.env.TZ ?? null
		},
		capture: captureContract
	};
}

export async function compareScreenshots(
	referencePath,
	candidatePath,
	destination,
	reportName = 'pixel-comparison.json',
	signal
) {
	await mkdir(destination, { recursive: true });
	const comparison = JSON.parse(
		await run(
			'python',
			[
				'-c',
				`import json,sys
from pathlib import Path
from PIL import Image,ImageChops
reference,candidate,destination,names_json=sys.argv[1:]
results={}
for name in json.loads(names_json):
 a=Image.open(Path(reference)/name).convert('RGB')
 b=Image.open(Path(candidate)/name).convert('RGB')
 size=(max(a.width,b.width),max(a.height,b.height))
 padded_a=Image.new('RGB',size)
 padded_b=Image.new('RGB',size)
 padded_a.paste(a,(0,0)); padded_b.paste(b,(0,0))
 difference=ImageChops.difference(padded_a,padded_b)
 bbox=difference.getbbox()
 count=sum(any(pixel) for pixel in difference.getdata())
 diff_name=name.removesuffix('.png')+'.diff.png'
 difference.save(Path(destination)/diff_name)
 results[name]={'size':list(b.size),'reference_size':list(a.size),'dimensions_match':a.size==b.size,'differing_pixels':count,'bounding_box':list(bbox) if bbox else None,'diff_image':diff_name}
print(json.dumps(results))`,
				referencePath,
				candidatePath,
				destination,
				JSON.stringify(screenshotNames)
			],
			undefined,
			90_000,
			undefined,
			signal
		)
	);
	await writeFile(resolve(destination, reportName), JSON.stringify(comparison, null, 2) + '\n');
	return comparison;
}

export async function assertNoLegacyEnvironmentFiles(checkout, trackedExamples = []) {
	const forbidden = (await readdir(checkout)).filter(
		(name) => /^(?:\.env|\.dev\.vars)(?:\.|$)/.test(name) && !trackedExamples.includes(name)
	);
	assert.deepEqual(forbidden, [], 'Legacy checkout must not contain local environment files');
}

async function verifyCheckout(checkout, signal) {
	const git = (args) => run('git', args, checkout, 90_000, undefined, signal);
	assert.equal(await git(['rev-parse', '--show-toplevel']), checkout);
	assert.equal(await git(['rev-parse', 'HEAD']), legacySourceSHA);
	assert.equal(await git(['rev-parse', 'HEAD^{tree}']), legacyTreeSHA);
	const examples = (await git(['ls-files', '--', '.env.example', '.dev.vars.example'])).split('\n');
	await assertNoLegacyEnvironmentFiles(checkout, examples);
	assert.equal(
		await git(['status', '--porcelain', '--untracked-files=all']),
		'',
		'Legacy checkout must be clean, including untracked files'
	);
	// Also detect tracked files hidden by assume-unchanged / skip-worktree flags.
	const paths = await git(['ls-files', '-v']);
	assert.ok(
		paths.split('\n').every((line) => line.startsWith('H ')),
		'No hidden tracked changes'
	);
}

async function availablePort() {
	const server = createServer();
	await new Promise((done, reject) => {
		server.once('error', reject);
		server.listen(0, '127.0.0.1', done);
	});
	const port = server.address().port;
	await new Promise((done) => server.close(done));
	return port;
}

// Match ui-browser.py's four settled captures. Legacy Svelte has different motion
// selectors, so this performs only screenshot preparation, not CMS/admin checks.
const capturePython = `import json,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
url,browser_path,destination,contract_json=sys.argv[1:]
out=Path(destination)
contract=json.loads(contract_json)
results={}
errors=[]
with sync_playwright() as playwright:
 browser=playwright.chromium.launch(executable_path=browser_path,args=contract['browserArgs'])
 for width,height,nojs in contract['viewports']:
  page=browser.new_page(viewport={'width':width,'height':height},reduced_motion=contract['reducedMotion'],java_script_enabled=not nojs)
  page.set_default_timeout(10000)
  page.on('pageerror',lambda error:errors.append(str(error)))
  response=page.goto(url,wait_until=contract['navigation'])
  assert response and response.status==200, 'Legacy portfolio must return HTTP 200'
  page.evaluate(contract['fonts'])
  total=page.evaluate('document.documentElement.scrollHeight')
  for y in range(0,total,height//2):
   page.evaluate('(y) => scrollTo(0, y)',y)
   page.wait_for_timeout(contract['scrollDelayMs'])
  page.wait_for_function('[...document.images].every(i => i.complete && i.naturalWidth > 0)')
  assert not page.evaluate('document.documentElement.scrollWidth > innerWidth')
  page.evaluate('scrollTo(0, 0)')
  page.wait_for_timeout(contract['settledDelayMs'])
  name='astro-'+('375-nojs' if nojs else str(width))+'.png'
  page.screenshot(path=str(out/name),full_page=contract['fullPage'])
  results[name]={'height':total,'images':page.locator('img').count()}
  page.close()
 assert not errors,errors
 browser.close()
print(json.dumps({'screenshots':results,'page_errors':errors}))`;

export function isOutsideDirectory(parent, child) {
	const path = relative(parent, child);
	return path === '..' || path.startsWith(`..${sep}`);
}

async function captureLegacyReference({ checkout: checkoutPath, browser, out }, signal) {
	const checkout = await realpath(resolve(checkoutPath));
	const destination = resolve(out);
	assert.ok(isOutsideDirectory(checkout, destination), 'Output must be outside legacy checkout');
	const committedEvidence = resolve(
		dirname(fileURLToPath(import.meta.url)),
		'../../apps/astro-emdash/tests/evidence'
	);
	assert.ok(
		isOutsideDirectory(committedEvidence, destination),
		'Never overwrite committed evidence'
	);
	await verifyCheckout(checkout, signal);
	const renderer = await rendererIdentity(browser, signal);
	// A fresh directory prevents a partial capture from reusing stale images or provenance.
	const resolvedParent = await realpath(dirname(destination));
	assert.ok(
		isOutsideDirectory(checkout, resolvedParent),
		'Resolved output parent must be outside legacy checkout'
	);
	assert.ok(
		isOutsideDirectory(committedEvidence, resolvedParent),
		'Resolved output parent must be outside committed evidence'
	);
	await mkdir(destination);
	const temporaryHome = await mkdtemp(resolve(tmpdir(), 'portfolio-legacy-home-'));
	const localEnvironment = commandEnvironment(temporaryHome);
	let server;
	let logs = '';
	const stopServer = () => {
		if (server?.pid) signalGroup(server.pid, 'SIGKILL');
	};
	try {
		const build = await run('pnpm', ['build'], checkout, 180_000, localEnvironment, signal);
		await writeFile(resolve(destination, 'legacy-build.log'), build + '\n');
		await verifyCheckout(checkout, signal);
		signal.throwIfAborted();
		const port = await availablePort();
		const origin = `http://127.0.0.1:${port}`;
		server = spawn(
			'pnpm',
			['exec', 'vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
			{
				cwd: checkout,
				env: localEnvironment,
				stdio: ['ignore', 'pipe', 'pipe'],
				detached: true
			}
		);
		signal.addEventListener('abort', stopServer, { once: true });
		let serverError;
		server.stdout.on('data', (data) => (logs += data));
		server.stderr.on('data', (data) => (logs += data));
		server.once('error', (error) => (serverError = error));
		const deadline = Date.now() + 60_000;
		let ready = false;
		while (Date.now() < deadline) {
			signal.throwIfAborted();
			if (serverError) throw serverError;
			assert.equal(server.exitCode, null, `Legacy preview exited: ${logs}`);
			try {
				const response = await fetch(origin, { signal: AbortSignal.timeout(1000) });
				if (response.status === 200) {
					ready = true;
					break;
				}
			} catch {
				/* Wait for the bounded local preview startup. */
			}
			await new Promise((done) => setTimeout(done, 200));
		}
		assert.ok(ready, `Legacy preview did not become ready: ${logs}`);
		const captured = JSON.parse(
			await run(
				'python',
				[
					'-c',
					capturePython,
					`${origin}/`,
					renderer.browser.executable,
					destination,
					JSON.stringify(captureContract)
				],
				undefined,
				90_000,
				localEnvironment,
				signal
			)
		);
		await verifyCheckout(checkout, signal);
		assert.deepEqual(
			await rendererIdentity(browser, signal),
			renderer,
			'Renderer changed during capture'
		);
		const images = {};
		for (const name of screenshotNames)
			images[name] = { sha256: sha256(await readFile(resolve(destination, name))) };
		// Diagnostic only: static images may come from a different OS/browser. The
		// candidate's strict gate instead compares against these verified fresh images.
		await compareScreenshots(
			committedEvidence,
			destination,
			resolve(destination, 'committed-baseline-drift'),
			'committed-baseline-drift.json',
			signal
		);
		const manifest = {
			version: 1,
			source: { sha: legacySourceSHA, tree: legacyTreeSHA, clean: true },
			renderer,
			images,
			captured
		};
		await writeFile(
			resolve(destination, 'reference-manifest.json'),
			JSON.stringify(manifest, null, 2) + '\n'
		);
		return manifest;
	} finally {
		signal.removeEventListener('abort', stopServer);
		if (server?.pid) {
			signalGroup(server.pid, 'SIGTERM');
			await new Promise((done) => setTimeout(done, 250));
			signalGroup(server.pid, 'SIGKILL');
		}
		await writeFile(resolve(destination, 'legacy-preview.log'), logs);
		await rm(temporaryHome, { recursive: true, force: true });
	}
}

export async function createLegacyReference(options) {
	const controller = new AbortController();
	const interrupt = () => controller.abort(new Error('Legacy reference interrupted'));
	process.on('SIGINT', interrupt);
	process.on('SIGTERM', interrupt);
	try {
		return await captureLegacyReference(options, controller.signal);
	} finally {
		process.removeListener('SIGINT', interrupt);
		process.removeListener('SIGTERM', interrupt);
	}
}

export async function validateLegacyReference(referencePath, browser) {
	const manifest = JSON.parse(
		await readFile(resolve(referencePath, 'reference-manifest.json'), 'utf8')
	);
	assert.equal(manifest.version, 1);
	assert.deepEqual(manifest.source, { sha: legacySourceSHA, tree: legacyTreeSHA, clean: true });
	assert.deepEqual(
		manifest.renderer,
		await rendererIdentity(browser),
		'Reference renderer must match candidate renderer'
	);
	assert.deepEqual(Object.keys(manifest.images).sort(), [...screenshotNames].sort());
	for (const name of screenshotNames) {
		assert.equal(
			sha256(await readFile(resolve(referencePath, name))),
			manifest.images[name].sha256,
			`Reference image hash mismatch: ${name}`
		);
	}
	return manifest;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const options = {};
	for (let i = 2; i < process.argv.length; i += 2) {
		const name = process.argv[i];
		assert.ok(['--checkout', '--browser', '--out'].includes(name), `Unknown argument: ${name}`);
		assert.ok(process.argv[i + 1], `Missing value: ${name}`);
		assert.ok(!options[name.slice(2)], `Duplicate argument: ${name}`);
		options[name.slice(2)] = process.argv[i + 1];
	}
	assert.ok(
		options.checkout && options.browser && options.out,
		'Usage: legacy-reference.mjs --checkout <clean immutable checkout> --browser <absolute executable> --out <fresh directory>'
	);
	await createLegacyReference(options);
	console.log(
		`PASS: immutable legacy ${legacySourceSHA}, four settled same-renderer reference images in ${resolve(options.out)}`
	);
}
