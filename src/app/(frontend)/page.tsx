import Header from '@/app/sections/header/Header';
import { Card } from '@/components/ui/card';
import { LayoutGroup } from 'framer-motion';

export default async function RootPage() {
  return (
    <main className="container mx-auto">
      <div className="mx-24 grid grid-cols-6 grid-flow-dense gap-2">
        <LayoutGroup>
          <Header />
          <Card className="aspect-square col-span-3 row-span-3">hero</Card>
          <Card className="aspect-square col-span-1 ">github</Card>
          <Card className="aspect-square col-span-1 ">LInkedin</Card>
          <Card className="aspect-square col-span-1 ">Email</Card>
        </LayoutGroup>
      </div>
    </main>
  );
}
