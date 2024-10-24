import { Heading } from '@/components/Heading';
import Paragraph from '@/components/Paragraph';
import { getAboutMe } from '@/lib/queries';

export default async function About() {
  const aboutMe = await getAboutMe();
  return (
    <section className="bg-background">
      <div className="container mx-auto p-6">
        <Heading level={2}>About Me</Heading>
        <Paragraph>{aboutMe}</Paragraph>
      </div>
    </section>
  );
}
