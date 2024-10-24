import About from '@/sections/About';
import FeaturedProjects from '@/sections/FeaturedProjects';
import Hero from '@/sections/Hero';
import UnfeaturedProjects from '@/sections/UnfeaturedProjects';

export default function RootPage() {
  return (
    <>
      <Hero />
      <div className="shadow-xl">
        <About />
        <FeaturedProjects />
        <UnfeaturedProjects />
      </div>
    </>
  );
}
