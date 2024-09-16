import { cn } from '@/lib/classNameMerge'
import { ComponentProps } from 'react'

type ContactListURLProps = ComponentProps<'button'>

export default function ContactListURL({ className, ...props }: ContactListURLProps) {
  return <button className={cn('text-4xl font-bold', className)} {...props} />
}
