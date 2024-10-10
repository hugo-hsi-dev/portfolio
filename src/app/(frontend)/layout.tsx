import { Media } from '@/payload-types';
import { Metadata } from 'next';

import BlockIsHighlightedProvider from '@/components/block/BlockIsHighlightingContext';
import CursorBorder from '@/components/cursorBorder/CursorBorder';
import { payload } from '@/lib/getPayload';
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
      <body className="my-6">
        <BlockIsHighlightedProvider>
          {children}
          <CursorBorder />
        </BlockIsHighlightedProvider>
      </body>
    </html>
  );
}
