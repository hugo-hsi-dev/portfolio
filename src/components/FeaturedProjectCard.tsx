import StackDivider from '@/components/StackDivider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FeaturedProject } from '@/lib/queries';
import { Media } from '@/payload-types';
import { ArrowSquareOut, GithubLogo } from '@phosphor-icons/react/dist/ssr';
import Image from 'next/image';
import Link from 'next/link';

export default function FeaturedProjectCard({
  content,
  description,
  image,
  links,
  stack,
  title,
}: Omit<FeaturedProject, 'id'>) {
  const { url, alt, height, width } = image as Media;
  return (
    <Card>
      <Image
        width={width!}
        height={height!}
        src={url!}
        alt={alt}
        className="w-full aspect-video object-cover"
      />
      <CardContent className="mt-6">
        <p>{content}</p>
      </CardContent>
      <StackDivider stack={stack} />
      <div className="flex justify-between items-center">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <div className="flex flex-row p-6 gap-2">
          <Button size="icon" variant="outline" asChild>
            <Link href={links.githubUrl}>
              <GithubLogo />
            </Link>
          </Button>
          <Button size="icon" disabled={!links.externalUrl} asChild>
            <Link href={links.externalUrl ?? ''}>
              <ArrowSquareOut />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
