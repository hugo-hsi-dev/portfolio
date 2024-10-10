'use client';

import { useBlockIsHighlightedContext } from '@/components/block/BlockIsHighlightingContext';
import { cn } from '@/lib/classNameMerge';
import { motion, useMotionValue } from 'framer-motion';
import { useEffect, useRef } from 'react';

type CursorBorderProps = {
  className?: string;
};

export default function CursorBorder({ className }: CursorBorderProps) {
  const cursorRef = useRef<HTMLDivElement>(null);

  const { isHighlighted } = useBlockIsHighlightedContext();

  const cursorX = useMotionValue(typeof window !== 'undefined' ? window.innerWidth / 2 : 0);
  const cursorY = useMotionValue(typeof window !== 'undefined' ? window.innerHeight / 2 : 0);

  useEffect(() => {
    const updatePosition = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    document.addEventListener('mousemove', updatePosition);

    return () => {
      document.removeEventListener('mousemove', updatePosition);
    };
  }, [cursorX, cursorY]);

  return (
    <motion.div
      ref={cursorRef}
      className={cn('pointer-events-none fixed left-0 top-0 z-50', className)}
      style={{
        x: cursorX,
        y: cursorY,
        translateX: '-50%',
        translateY: '-50%',
      }}
    >
      {!isHighlighted && (
        <motion.div
          layoutRoot
          layoutId="border"
          className="w-8 h-8 border-rose-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ borderWidth: 4, borderRadius: 40 }}
        />
      )}
    </motion.div>
  );
}
