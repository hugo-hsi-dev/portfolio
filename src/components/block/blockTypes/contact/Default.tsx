'use client'

import BlockOpenTrigger from '@/components/block/BlockOpenTrigger'
import EmailButton from '@/components/block/blockTypes/contact/defaultButtons/buttons/EmailDefaultButton'
import GithubButton from '@/components/block/blockTypes/contact/defaultButtons/buttons/GithubDefaultButton'
import LinkedinButton from '@/components/block/blockTypes/contact/defaultButtons/buttons/LinkedinDefaultButton'
import { liVariants } from '@/components/block/blockTypes/contact/variants'

import { useContactBlockContext } from '@/contexts/ContactBlockContext'
import { useExpandedBlockContext } from '@/contexts/ExpandedBlockContext'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus } from 'lucide-react'

type DefaultProps = {
  email: string
  githubUrl: string
  linkedinUrl: string
}

export default function Default({ email, githubUrl, linkedinUrl }: DefaultProps) {
  const { expandedBlock, setExpandedBlock } = useExpandedBlockContext()
  const { hoveredItem, isCopied } = useContactBlockContext()

  return (
    <AnimatePresence key="test">
      <motion.ul
        initial={'hidden'}
        animate={'show'}
        exit={'hidden'}
        transition={{ staggerChildren: 0.1, delayChildren: 0.3 }}
        className="grid grid-cols-2 grid-row-2 gap-12"
      >
        <motion.li variants={liVariants}>
          <EmailButton />
        </motion.li>
        <motion.li variants={liVariants}>
          <GithubButton />
        </motion.li>
        <motion.li
          className="aspect-square flex justify-center items-center relative"
          variants={liVariants}
        >
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
        </motion.li>
        <motion.li variants={liVariants}>
          <LinkedinButton />
        </motion.li>
      </motion.ul>
    </AnimatePresence>
  )
}
