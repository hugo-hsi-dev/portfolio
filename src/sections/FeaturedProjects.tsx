import FeaturedProjectCard from '@/components/FeaturedProjectCard';
import { Heading } from '@/components/Heading';
import { getFeaturedProjects } from '@/lib/queries';

export default async function FeaturedProjects() {
  const featuredProjects = await getFeaturedProjects();
  console.log(featuredProjects);
  return (
    <section className="bg-background">
      <div className="container mx-auto p-6">
        <Heading level={2}>Projects</Heading>
        <div className="mt-6 flex flex-col gap-6">
          {featuredProjects.map(({ id, ...project }) => (
            <FeaturedProjectCard key={id} {...project} />
          ))}
        </div>
      </div>
    </section>
  );
}
