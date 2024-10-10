'use client';

import { useBlockContext } from '@/components/block/BlockContext';
import { AnimatePresence, HTMLMotionProps, motion } from 'framer-motion';

type BlockExpandedContentProps = HTMLMotionProps<'div'>;

export default function BlockExpandedContent({ ...props }: BlockExpandedContentProps) {
  const { isExpanded } = useBlockContext();
  return (
    <AnimatePresence mode="wait">
      {isExpanded && (
        <motion.div
          layout="position"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          {...props}
        />
      )}
    </AnimatePresence>
  );
}
