import schemaSeed from './schema.seed.json' with { type: 'json' };
import baseline from './fixture.json' with { type: 'json' };
import manifest from './manifest.json' with { type: 'json' };

export { schemaSeed, baseline };
const media = manifest.media;
const repeat = (items) => items.map((value) => ({ value }));

/** EmDash 1.0.1 SeedFile: non-routable, slugless records keep their explicit seed IDs. */
export function createDraftSeed(fixture = baseline) {
	const seed = structuredClone(schemaSeed);
	const record = (externalId, position, data) => ({
		id: externalId,
		slug: null,
		locale: 'en',
		status: 'draft',
		data: { external_id: externalId, position, ...data }
	});
	const sectionTitle = (id) => fixture.sections.find((section) => section.id === id).title;
	seed.content = {
		portfolio_home: [
			record('portfolio-v1:home', 0, {
				name: fixture.hero.name,
				headline: fixture.hero.headline,
				description: fixture.hero.description,
				aside: fixture.hero.aside,
				location: fixture.hero.location,
				primary_action_label: fixture.hero.primaryAction.label,
				resume_action_label: fixture.hero.resumeAction.label,
				projects_heading: sectionTitle('projects'),
				experience_heading: sectionTitle('experience'),
				education_heading: sectionTitle('education'),
				skills_heading: sectionTitle('tech'),
				footer_heading: fixture.footer.heading,
				footer_description: fixture.footer.description,
				seo_title: fixture.seo.title,
				seo_description: fixture.seo.description,
				og_title: fixture.seo.openGraph.title,
				og_description: fixture.seo.openGraph.description
			})
		],
		portfolio_projects: fixture.projects.map((project, position) => {
			const data = {
				title: project.title,
				category: project.category,
				description: project.description,
				technologies: repeat(project.technologies),
				...(project.url ? { url: project.url } : {})
			};
			if (project.image) {
				const asset = media.find((item) => item.publicUrl === project.image.src);
				if (!asset) throw new Error(`Unmapped project image: ${project.id}`);
				// Existing site-relative files; no $media download and no invented local media row.
				data.image = {
					provider: 'external',
					id: `portfolio-v1:media:${asset.id}`,
					src: asset.publicUrl,
					alt: project.image.alt
				};
			}
			return record(`portfolio-v1:projects:${project.id}`, position, data);
		}),
		portfolio_experience: fixture.experience.map(({ id, ...data }, position) =>
			record(`portfolio-v1:experience:${id}`, position, data)
		),
		portfolio_education: fixture.education.map(({ id, ...data }, position) =>
			record(`portfolio-v1:education:${id}`, position, data)
		),
		portfolio_skill_groups: fixture.skillGroups.map((group, position) =>
			record(`portfolio-v1:skillGroups:${group.id}`, position, {
				label: group.label,
				items: repeat(group.items)
			})
		),
		portfolio_contacts: fixture.contacts.map(({ id, ...data }, position) =>
			record(`portfolio-v1:contacts:${id}`, position, data)
		)
	};
	return seed;
}
