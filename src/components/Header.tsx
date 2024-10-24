import { Heading } from '@/components/Heading';
import Navbar from '@/components/Navbar';

export default function Header() {
  return (
    <header className="fixed left-0 top-0 right-0 z-50 h-[80px] flex items-center justify-between px-6 backdrop-blur-xl border-b bg-background/80">
      <Heading level={1}>
        hugohsi<span className="text-primary">.</span>dev
      </Heading>
      <Navbar />
    </header>
  );
}
