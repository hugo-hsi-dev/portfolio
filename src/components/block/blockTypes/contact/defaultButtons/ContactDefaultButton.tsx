import { motion } from 'framer-motion'
import { ComponentProps } from 'react'

type ContactDefaultButtonProps = ComponentProps<'button'>
export default function ContactDefaultButton({ children, ...props }: ContactDefaultButtonProps) {
  return (
    <button className="relative rounded-full w-full h-full" {...props}>
      <motion.div
        className="bg-black aspect-square rounded-full text-white flex"
        whileHover={{ scale: 0.9 }}
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-2/4 -translate-y-2/4 text-white z-10">
        {children}
      </div>
    </button>
  )
}
