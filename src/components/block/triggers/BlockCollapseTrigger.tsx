'use client';

import { useBlockContext } from '@/components/block/BlockContext';
import { useBlockIsHighlightedContext } from '@/components/block/BlockIsHighlightingContext';
import { AsChildProps } from '@/types/asChild';
import { Slot } from '@radix-ui/react-slot';
import { MouseEvent } from 'react';

type BlockCollapseTrigger = AsChildProps<'button'>;

export default function BlockCollapseTrigger({
  onClick,
  onMouseEnter,
  onMouseLeave,
  asChild,
  ...props
}: BlockCollapseTrigger) {
  const Comp = asChild ? Slot : 'button';
  const { isExpanded, setIsExpanded, setIsHighlighted } = useBlockContext();
  const { setIsHighlighted: globalSetIsHighlighted } = useBlockIsHighlightedContext();

  function handleClick(e: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>) {
    setIsExpanded(false);

    setTimeout(() => {
      setIsHighlighted(false);
      globalSetIsHighlighted(false);
    }, 700);

    if (onClick) {
      onClick(e);
    }
  }

  function handleMouseEnter(e: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>) {
    if (isExpanded) {
      setIsHighlighted(true);
      globalSetIsHighlighted(true);
    }
    if (onMouseEnter) {
      onMouseEnter(e);
    }
  }

  function handleMouseLeave(e: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>) {
    setIsHighlighted(false);
    globalSetIsHighlighted(false);
    if (onMouseLeave) {
      onMouseLeave(e);
    }
  }

  return (
    <Comp
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    />
  );
}
