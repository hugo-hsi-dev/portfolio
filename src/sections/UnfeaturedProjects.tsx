import { Heading } from '@/components/Heading';
import UnfeaturedProjectCard from '@/components/UnfeaturedProjectCard';
import { getUnfeaturedProjects } from '@/lib/queries';

export default async function UnfeaturedProjects() {
  const featuredProjects = await getUnfeaturedProjects();
  console.log(featuredProjects);
  return (
    <section className="bg-background lg:pb-6">
      <div className="container mx-auto p-6">
        <Heading level={2}>Other things I&apos;ve built</Heading>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredProjects.map(({ id, ...project }) => (
            <UnfeaturedProjectCard key={id} {...project} />
          ))}
        </div>
      </div>
    </section>
  );
}
