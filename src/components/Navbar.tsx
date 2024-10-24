import { Button } from '@/components/ui/button';
import Link from 'next/link';

const navConfig = [
  {
    name: 'Projects',
    href: '#projects',
  },
  {
    name: 'About',
    href: '#about',
  },
];

export default function Navbar() {
  return (
    <nav className="gap-4 hidden sm:flex">
      {navConfig.map(({ href, name }) => (
        <Button variant="ghost" key={href} asChild>
          <Link href={href}>{name}</Link>
        </Button>
      ))}
    </nav>
  );
}
