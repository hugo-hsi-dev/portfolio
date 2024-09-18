'use client'

import BlockCloseTrigger from '@/components/block/BlockCloseTrigger'
import EmailExpandedItem from '@/components/block/blockTypes/contact/expandedItems/items/EmailExpandedItem'
import GithubExpandedItem from '@/components/block/blockTypes/contact/expandedItems/items/GithubExpandedItem'
import LinkedinExpandedItem from '@/components/block/blockTypes/contact/expandedItems/items/LinkedInExpandedItem'

import { AnimatePresence, motion } from 'framer-motion'

type ExpandedProps = {
  email: string
  githubUrl: string
  linkedinUrl: string
}

export default function Expanded({ email, githubUrl, linkedinUrl }: ExpandedProps) {
  return (
    <AnimatePresence key="test">
      <div className="flex flex-col justify-between h-full">
        <motion.h3
          className="text-7xl font-bold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ delay: 0.3 }}
          layout="position"
        >
          Please{' '}
          <span className="text-sky-500">
            <BlockCloseTrigger>reach out!</BlockCloseTrigger>
          </span>
        </motion.h3>
        <motion.ul
          className="flex flex-col gap-12"
          initial={'hidden'}
          animate={'show'}
          exit={'hidden'}
          transition={{ staggerChildren: 0.1, delayChildren: 0.3 }}
        >
          <EmailExpandedItem email={email} />
          <GithubExpandedItem githubUrl={githubUrl} />
          <LinkedinExpandedItem linkedinUrl={linkedinUrl} />
        </motion.ul>
      </div>
    </AnimatePresence>
  )
}
