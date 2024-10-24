'use client';

import { AuroraBackground } from '@/components/ui/aurora-background';
import { motion, useScroll, useTransform } from 'framer-motion';
export default function Hero() {
  const { scrollY } = useScroll();

  const scale = useTransform(scrollY, [0, 200, 1000], [1, 0.9, 0.85]);
  const borderRadius = useTransform(scrollY, [0, 100, 1000], [0, 24, 32]);
  const translateY = useTransform(scrollY, [0, 1000], [0, 200]);
  const opacity = useTransform(scrollY, [1000, 1100], [1, 0]);

  return (
    <motion.section
      className="h-screen sticky top-0 left-0 right-0 bottom-0 -z-10 overflow-hidden"
      style={{ scale, borderRadius, translateY, opacity }}
    >
      <AuroraBackground>
        <motion.div
          initial={{ opacity: 0.0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: 'easeInOut',
          }}
          className="relative flex flex-col gap-4 justify-center px-4"
        >
          <div className="text-base md:text-4xl">Hi my name is Hugo Hsi</div>
          <div className="text-3xl md:text-7xl font-bold md:py-4">
            I build responsive
            <br />
            web applications<span className="text-primary">.</span>
          </div>
        </motion.div>
      </AuroraBackground>
    </motion.section>
  );
}
