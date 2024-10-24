import { Media } from '@/payload-types';
import { Metadata } from 'next';

import Header from '@/components/Header';
import SheetNav from '@/components/SheetNav';
import { Toaster } from '@/components/ui/sonner';
import { payload } from '@/lib/getPayload';
import Footer from '@/sections/Footer';
import '@/styles/globals.css';
import { Manrope } from 'next/font/google';
import { PropsWithChildren } from 'react';

const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const { title, description, favicon, openGraphImage } = await payload.findGlobal({
    slug: 'meta',
  });

  // to satisfy Payloads type generation, as favicon variable could potentially be a number
  const { url: icons } = favicon as Media;
  const { url: images } = openGraphImage as Media;

  return {
    title,
    description,
    icons,
    openGraph: {
      images: images ?? '',
    },
  };
}

export default async function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" className={manrope.className}>
      <body className="bg-foreground">
        <Header />
        <main className="absolute top-0 left-0 right-0">
          {children}
          <div className="h-[160px] relative -z-50" />
        </main>
        <Footer />
        <SheetNav />
        <Toaster />
      </body>
    </html>
  );
}
