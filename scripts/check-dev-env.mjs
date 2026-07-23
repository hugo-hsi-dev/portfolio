import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const ENV_FILE = resolve('.dev.vars');
const TOKEN_NAME = 'BOARD_RESET_TOKEN';
const MINIMUM_TOKEN_LENGTH = 32;
const PLACEHOLDER_PATTERN = /(?:replace|placeholder|change[-_ ]?me|example|your[-_ ])/i;
const REQUIRED_LOCAL_ORIGINS = [
	'http://127.0.0.1:5173',
	'http://localhost:5173',
	'http://127.0.0.1:4173',
	'http://localhost:4173'
];

function setupInstructions(reason) {
	return [
		`Local development stopped: ${reason}`,
		'',
		'Set up the shared local Worker variables:',
		'  1. cp .dev.vars.example .dev.vars',
		'  2. Replace BOARD_RESET_TOKEN with one random value of at least 32 characters.',
		'  3. Keep ALLOWED_ORIGINS set to the local origins from the example.',
		'',
		'You can generate a token with: openssl rand -hex 32'
	].join('\n');
}

function parseAssignments(source) {
	const assignments = new Map();
	for (const rawLine of source.split(/\r?\n/)) {
		const line = rawLine.trim();
		if (!line || line.startsWith('#')) continue;
		const separator = line.indexOf('=');
		if (separator < 1) continue;
		const key = line.slice(0, separator).trim();
		const value = line
			.slice(separator + 1)
			.trim()
			.replace(/^(['"])(.*)\1$/, '$2');
		const values = assignments.get(key) ?? [];
		values.push(value);
		assignments.set(key, values);
	}
	return assignments;
}

let source;
try {
	source = await readFile(ENV_FILE, 'utf8');
} catch {
	console.error(setupInstructions('.dev.vars is missing.'));
	process.exit(1);
}

const assignments = parseAssignments(source);
const tokens = assignments.get(TOKEN_NAME) ?? [];
if (tokens.length === 0 || tokens.some((token) => token.length === 0)) {
	console.error(setupInstructions('BOARD_RESET_TOKEN is missing.'));
	process.exit(1);
}
if (new Set(tokens).size !== 1) {
	console.error(setupInstructions('BOARD_RESET_TOKEN has inconsistent values in .dev.vars.'));
	process.exit(1);
}

const [token] = tokens;
if (token.length < MINIMUM_TOKEN_LENGTH) {
	console.error(
		setupInstructions(`BOARD_RESET_TOKEN must contain at least ${MINIMUM_TOKEN_LENGTH} characters.`)
	);
	process.exit(1);
}
if (PLACEHOLDER_PATTERN.test(token)) {
	console.error(setupInstructions('BOARD_RESET_TOKEN still contains a placeholder value.'));
	process.exit(1);
}
if (process.env.BOARD_RESET_TOKEN && process.env.BOARD_RESET_TOKEN !== token) {
	console.error(
		setupInstructions(
			'BOARD_RESET_TOKEN conflicts with the value already exported in the current shell.'
		)
	);
	process.exit(1);
}

const allowedOrigins = assignments.get('ALLOWED_ORIGINS') ?? [];
const configuredOrigins = new Set(
	(allowedOrigins[0] ?? '')
		.split(',')
		.map((origin) => origin.trim())
		.filter(Boolean)
);
if (
	allowedOrigins.length !== 1 ||
	configuredOrigins.size !== REQUIRED_LOCAL_ORIGINS.length ||
	REQUIRED_LOCAL_ORIGINS.some((origin) => !configuredOrigins.has(origin))
) {
	console.error(
		setupInstructions('ALLOWED_ORIGINS must match the four local origins in the example.')
	);
	process.exit(1);
}
