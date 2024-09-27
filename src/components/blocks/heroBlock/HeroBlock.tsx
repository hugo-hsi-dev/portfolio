'use client'

import Block from '@/components/blocks/primitives/Block'
import CollapseTrigger from '@/components/blocks/primitives/CollapseTrigger'
import Expanded from '@/components/blocks/primitives/Expanded'
import ExpandTrigger from '@/components/blocks/primitives/ExpandTrigger'
import { AnimatePresence, motion } from 'framer-motion'

export default function HeroBlock() {
  return (
    <Block id="test" cols={2} rows={2} className="bg-black text-white @container">
      <motion.div className="flex flex-col gap-6 justify-end h-full">
        <motion.h1
          className="lg muted"
          layout="position"
          transition={{ delay: 0.1, type: 'spring' }}
        >
          Hi, my name is Hugo&nbsp;Hsi
        </motion.h1>
        <AnimatePresence>
          <Expanded>
            <motion.p
              className="max-w-[640px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.2 }}
              layout="position"
            >
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
              incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
              exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure
              dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
              Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
              mollit anim id est laborum.
            </motion.p>
          </Expanded>
        </AnimatePresence>
        <motion.h2
          className="display cursor-default"
          layout="position"
          transition={{ delay: 0.2, type: 'spring' }}
        >
          I bring
          <br />
          <ExpandTrigger asChild>
            <span className="text-lime-500">interactive</span>
          </ExpandTrigger>
          <br />
          <CollapseTrigger asChild>
            <span className="text-rose-500">design</span>
          </CollapseTrigger>{' '}
          to life
        </motion.h2>
      </motion.div>
    </Block>
  )
}
