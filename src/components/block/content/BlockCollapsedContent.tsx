'use client';

import { useBlockContext } from '@/components/block/BlockContext';
import { AnimatePresence, AnimatePresenceProps } from 'framer-motion';
import { PropsWithChildren } from 'react';

type BlockCollapsedContentProps = AnimatePresenceProps & PropsWithChildren;

export default function BlockCollapsedContent({ children, ...props }: BlockCollapsedContentProps) {
  const { isExpanded } = useBlockContext();
  return <AnimatePresence {...props}>{!isExpanded && <>{children}</>}</AnimatePresence>;
}
