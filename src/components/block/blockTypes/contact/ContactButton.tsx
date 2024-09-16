import { motion } from 'framer-motion'
import { Dispatch, PropsWithChildren, SetStateAction } from 'react'

type ContactButtonProps = PropsWithChildren & {
  item: string
  setState: Dispatch<SetStateAction<string | undefined>>
  setIsCopied: Dispatch<SetStateAction<boolean>>
}
export default function ContactButton({
  children,
  item,
  setState,
  setIsCopied,
}: ContactButtonProps) {
  return (
    <li
      className="relative rounded-full"
      onMouseOver={() => setState(item)}
      onMouseOut={() => {
        setState(undefined)
        setIsCopied(false)
      }}
    >
      <motion.div
        className="bg-black aspect-square rounded-full text-white flex"
        whileHover={{ scale: 0.9 }}
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-2/4 -translate-y-2/4 text-white z-10">
        {children}
      </div>
    </li>
  )
}
