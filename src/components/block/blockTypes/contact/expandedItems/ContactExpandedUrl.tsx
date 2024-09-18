import { cn } from '@/lib/classNameMerge'
import { ComponentProps } from 'react'

type ContactExpandedUrlProps = ComponentProps<'button'>

export default function ContactExpandedUrl({ className, ...props }: ContactExpandedUrlProps) {
  return <button className={cn('text-4xl font-bold', className)} {...props} />
}
