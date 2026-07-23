import type { z } from 'zod';

export interface ContentDocument<TMetadata> {
	slug: string;
	metadata: TMetadata;
}

export function parseFrontmatterDocument<TMetadata>(
	source: string,
	sourcePath = 'content.md'
): Omit<ContentDocument<TMetadata>, 'slug'> {
	const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);

	if (!match) {
		throw new Error(`Missing JSON frontmatter in ${sourcePath}`);
	}

	let metadata: TMetadata;
	try {
		metadata = JSON.parse(match[1]) as TMetadata;
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		throw new Error(`Invalid JSON frontmatter in ${sourcePath}: ${message}`, { cause: error });
	}

	if (match[2].trim()) {
		throw new Error(
			`Unexpected Markdown body in ${sourcePath}; move display content into typed frontmatter`
		);
	}

	return { metadata };
}

export function parseContentDocument<TSchema extends z.ZodType>(
	slug: string,
	source: string,
	sourcePath: string,
	schema: TSchema
): ContentDocument<z.output<TSchema>> {
	const document = parseFrontmatterDocument<unknown>(source, sourcePath);
	const result = schema.safeParse(document.metadata);

	if (!result.success) {
		const issue = result.error.issues[0];
		const field = issue.path.length ? issue.path.join('.') : 'frontmatter';
		throw new Error(`Invalid content in ${sourcePath} at ${field}: ${issue.message}`);
	}

	return {
		slug,
		metadata: result.data
	};
}

export function slugFromPath(path: string) {
	return path.split('/').pop()?.replace(/\.md$/, '') ?? path;
}
