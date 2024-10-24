import { cn } from '@/lib/utils';
import { cva, VariantProps } from 'class-variance-authority';
import React from 'react';

const headingVariants = cva('scroll-m-20 tracking-tight', {
  variants: {
    level: {
      1: 'text-4xl font-extrabold lg:text-5xl',
      2: 'border-b pb-2 text-3xl font-semibold first:mt-0',
      3: 'text-2xl font-semibold',
      4: 'text-xl font-semibold',
    },
  },
});

type HeadingProps = React.AllHTMLAttributes<HTMLHeadingElement> &
  VariantProps<typeof headingVariants>;

export const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, level = 1, ...props }, ref) => {
    const Comp = `h${level}` as 'h1';
    return <Comp className={cn(headingVariants({ level, className }))} ref={ref} {...props} />;
  },
);

Heading.displayName = 'Heading';
