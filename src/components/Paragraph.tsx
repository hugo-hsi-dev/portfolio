import { cn } from '@/lib/utils';
import { ComponentProps } from 'react';

export default function Paragraph({ className, ...props }: ComponentProps<'p'>) {
  return <p className={cn('leading-7 [&:not(:first-child)]:mt-6', className)} {...props} />;
}
