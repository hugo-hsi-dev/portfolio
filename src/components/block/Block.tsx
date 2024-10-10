'use client';

import BlockProvider from '@/components/block/BlockContext';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/classNameMerge';
import { motion } from 'framer-motion';
import { ComponentProps, ReactNode, useState } from 'react';

type BlockProps = ComponentProps<typeof MotionCard> & {
  collapsedClassName?: string;
  expandedClassName?: string;
};

export default function Block({
  children,
  className,
  collapsedClassName,
  expandedClassName,
  ...props
}: BlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHighlighted, setIsHighlighted] = useState(false);

  return (
    <BlockProvider value={{ isExpanded, setIsExpanded, isHighlighted, setIsHighlighted }}>
      <MotionCard
        layout
        layoutDependency={[isExpanded, setIsExpanded]}
        className={cn(
          'aspect-square relative',
          className,
          isExpanded ? expandedClassName : collapsedClassName,
        )}
        {...props}
      >
        {children as ReactNode}

        {isHighlighted && (
          <motion.div
            className="absolute border-rose-500 -top-2 -left-2 -right-2 -bottom-2 pointer-events-none"
            style={{ borderWidth: 4, borderRadius: 16, opacity: 1 }}
            exit={{ opacity: 0 }}
            layoutId="border"
          />
        )}
      </MotionCard>
    </BlockProvider>
  );
}

const MotionCard = motion.create(Card);
