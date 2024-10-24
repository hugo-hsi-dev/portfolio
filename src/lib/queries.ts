import { payload } from '@/lib/getPayload';
import { Contact, Project } from '@/payload-types';
import 'server-only';

export async function getAllProjects() {
  const { docs: projects } = await payload.find({ collection: 'projects' });
  const filteredProjects = projects.map((project) => projectDTO(project));
  return filteredProjects;
}

function projectDTO(project: Project) {
  return {
    featured: project.featured,
    id: project.id,
    description: project.description,
    links: project.links,
    title: project.title,
    content: project.content,
    image: project.image,
    stack: project.stack,
  };
}

export async function getFeaturedProjects() {
  const { docs: featuredProjects } = await payload.find({
    collection: 'projects',
    where: {
      featured: {
        equals: true,
      },
    },
  });
  const filteredProjects = featuredProjects.map((project) => featuredProjectDTO(project));
  return filteredProjects;
}

export type FeaturedProject = ReturnType<typeof featuredProjectDTO>;

function featuredProjectDTO(project: Project) {
  return {
    id: project.id,
    description: project.description,
    links: project.links,
    title: project.title,
    content: project.content,
    image: project.image,
    stack: project.stack,
  };
}

export async function getUnfeaturedProjects() {
  const { docs: unfeaturedProjects } = await payload.find({
    collection: 'projects',
    where: {
      featured: {
        equals: false,
      },
    },
  });
  const filteredProjects = unfeaturedProjects.map((project) => unfeaturedProjectDTO(project));
  return filteredProjects;
}

export type UnfeaturedProject = ReturnType<typeof unfeaturedProjectDTO>;

function unfeaturedProjectDTO(project: Project) {
  return {
    id: project.id,
    description: project.description,
    links: project.links,
    title: project.title,
    stack: project.stack,
  };
}

export async function getAboutMe() {
  const { content } = await payload.findGlobal({
    slug: 'aboutMe',
  });
  return content;
}

export async function getContact() {
  const contact = await payload.findGlobal({ slug: 'contacts' });
  return contactDTO(contact);
}

export type ContactDTO = ReturnType<typeof contactDTO>;

function contactDTO(contact: Contact) {
  return {
    email: contact.email,
    githubUrl: contact.githubUrl,
    linkedinUrl: contact.linkedinUrl,
  };
}
