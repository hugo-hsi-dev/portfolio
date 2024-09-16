'use client'

import BlockOpenTrigger from '@/components/block/BlockOpenTrigger'
import ContactButton from '@/components/block/blockTypes/contact/ContactButton'
import { useExpandedBlockContext } from '@/contexts/ExpandedBlockContext'
import { AnimatePresence, motion } from 'framer-motion'
import { Github, Linkedin, Mail, Plus } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

type DefaultProps = {
  email: string
  githubUrl: string
  linkedinUrl: string
}
export default function Default({ email, githubUrl, linkedinUrl }: DefaultProps) {
  const [hoveredItem, setHoveredItem] = useState<undefined | string>()
  const [isCopied, setIsCopied] = useState(false)
  const { expandedBlock, setExpandedBlock } = useExpandedBlockContext()

  function handleEmailClick() {
    navigator.clipboard.writeText(email)
    setIsCopied(true)
  }

  return (
    <div>
      <ul className="grid grid-cols-2 grid-row-2 gap-12">
        <button onClick={handleEmailClick}>
          <ContactButton item="Email" setState={setHoveredItem} setIsCopied={setIsCopied}>
            <Mail />
          </ContactButton>
        </button>
        <Link href={githubUrl} target="_blank">
          <ContactButton item="Github" setState={setHoveredItem} setIsCopied={setIsCopied}>
            <Github />
          </ContactButton>
        </Link>
        <li className="aspect-square flex justify-center items-center relative">
          <BlockOpenTrigger className="rounded-full">
            <motion.div
              className="w-[50px] h-[50px] bg-fuchsia-500 flex justify-center items-center rounded-full"
              onClick={() => setExpandedBlock('contact')}
              whileHover={{ scale: 1.1 }}
            >
              <Plus className="text-white" />
            </motion.div>
          </BlockOpenTrigger>
          <AnimatePresence>
            {hoveredItem && (
              <motion.div
                className="absolute bg-fuchsia-500 h-full w-full rounded-full flex justify-center items-center text-xl font-bold text-white"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                {isCopied ? 'Copied!' : hoveredItem}
              </motion.div>
            )}
          </AnimatePresence>
        </li>
        <Link href={linkedinUrl} target="_blank">
          <ContactButton item="Linkedin" setState={setHoveredItem} setIsCopied={setIsCopied}>
            <Linkedin />
          </ContactButton>
        </Link>
      </ul>
    </div>
  )
}
