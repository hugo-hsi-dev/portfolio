'use client';

import { Heading } from '@/components/Heading';
import { AuroraBackground } from '@/components/ui/aurora-background';
import { ContactDTO } from '@/lib/queries';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { toast } from 'sonner';

export default function FooterComp({ email, githubUrl, linkedinUrl }: ContactDTO) {
  const { scrollYProgress } = useScroll();

  const scale = useTransform(scrollYProgress, [0.8, 1], [0.85, 1]);
  const borderRadius = useTransform(scrollYProgress, [0.99, 1], [32, 0]);
  const translateY = useTransform(scrollYProgress, [0.8, 1], [-200, 0]);
  const opacity = useTransform(scrollYProgress, [0.7, 0.8], [0, 1]);
  const zIndex = useTransform(scrollYProgress, [0.99, 1], [-10, 50]);

  return (
    <motion.footer
      className="fixed left-0 bottom-0 right-0 h-[160px] bg-background overflow-hidden"
      style={{ scale, borderRadius, translateY, opacity, zIndex }}
    >
      <AuroraBackground className="h-[160px]">
        <div className="absolute bottom-0 left-0 right-0 top-0 p-6 shadow-inner">
          <Heading level={3}>
            hugohsi<span className="text-primary">.</span>dev
          </Heading>
          <div className="flex flex-col mt-2">
            <button
              className="w-fit cursor-pointer"
              onClick={() => {
                navigator.clipboard.writeText(email);
                toast.info('Copied to clipboard');
              }}
            >
              {email}
            </button>
            <Link href={githubUrl} target="_blank">
              {githubUrl}
            </Link>
            <Link href={linkedinUrl} target="_blank">
              {linkedinUrl}
            </Link>
          </div>
        </div>
      </AuroraBackground>
    </motion.footer>
  );
}
