'use client'

import React from 'react'
import HoverButtonTrigger from './contexts/HoverButtonTrigger'
import HoverButtonDisplay from './contexts/HoverButtonDisplay'
import { Github, Linkedin, Mail, Plus } from 'lucide-react'
import CircleButton from '@/components/buttons/CircleButton'
import Button from '@/components/buttons/Button'
import { useButtonHoverContext } from './contexts/ButtonHoverContext'
import { AnimatePresence, motion } from 'framer-motion'
import BlockOpenTrigger from '../../BlockOpenTrigger'

export default function Default() {
  const { buttonHover } = useButtonHoverContext()

  return (
    <div className="flex flex-col justify-between h-full">
      <div className="relative h-full">
        <div className="absolute left-1/2 top-1/2 -translate-y-2/4 -translate-x-2/4">
          {buttonHover ? (
            <Button layoutId="expand-button">
              <AnimatePresence>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <HoverButtonDisplay />
                </motion.div>
              </AnimatePresence>
            </Button>
          ) : (
            <BlockOpenTrigger>
              <CircleButton layoutId="expand-button">
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Plus />
                  </motion.div>
                </AnimatePresence>
              </CircleButton>
            </BlockOpenTrigger>
          )}
        </div>
      </div>
      <div className="flex justify-between items-end w-full">
        <HoverButtonTrigger id="Email">
          <Mail />
        </HoverButtonTrigger>
        <HoverButtonTrigger id="Github">
          <Github />
        </HoverButtonTrigger>
        <HoverButtonTrigger id="Linkedin">
          <Linkedin />
        </HoverButtonTrigger>
      </div>
    </div>
  )
}
