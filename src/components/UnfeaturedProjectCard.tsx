import StackDivider from '@/components/StackDivider';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { UnfeaturedProject } from '@/lib/queries';
import { ArrowSquareOut, GithubLogo } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';

export default function UnfeaturedProjectCard({
  title,
  description,
  links,
  stack,
}: Omit<UnfeaturedProject, 'id'>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <StackDivider stack={stack} />
      <CardFooter className="mt-6 gap-2 justify-end">
        <Button size="icon" className="flex-1" variant="outline" asChild>
          <Link href={links.githubUrl}>
            <GithubLogo />
          </Link>
        </Button>
        <Button size="icon" disabled={!links.externalUrl} asChild>
          <Link href={links.externalUrl ?? ''}>
            <ArrowSquareOut />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
