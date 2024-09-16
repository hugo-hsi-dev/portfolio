import { cn } from '@/lib/classNameMerge'
import { motion } from 'framer-motion'
import { ComponentProps, PropsWithChildren } from 'react'

type ContactListIconProps = ComponentProps<typeof motion.button> & PropsWithChildren

export default function ContactListIcon({ children, className, ...props }: ContactListIconProps) {
  return (
    <div className="relative w-[100px] h-[100px]">
      <motion.button
        className={cn('aspect-square rounded-full bg-black h-full w-full', className)}
        whileHover={{ scale: 0.9 }}
        {...props}
      ></motion.button>
      <div className="absolute top-1/2 left-1/2 -translate-x-2/4 -translate-y-2/4 z-10">
        {children}
      </div>
    </div>
  )
}
