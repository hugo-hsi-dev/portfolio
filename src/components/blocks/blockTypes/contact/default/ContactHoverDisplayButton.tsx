'use client'

import React from 'react'
import { useContactHoverContext } from '../contexts/ContactHoverContext'
import Button from '@/components/buttons/Button'
import { AnimatePresence, motion } from 'framer-motion'
import HoverButtonDisplay from '../ContactHoverDisplay'
import BlockOpenTrigger from '@/components/blocks/BlockOpenTrigger'
import CircleButton from '@/components/buttons/CircleButton'
import { Plus } from 'lucide-react'
import { useCopyEmailContext } from '../contexts/CopyEmailContext'

export default function ContactHoverDisplayButton() {
  const { hoveredContact } = useContactHoverContext()
  const { isCopied } = useCopyEmailContext()
  return (
    <>
      {hoveredContact ? (
        <Button layoutId="expand-button">
          <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {!isCopied ? <HoverButtonDisplay /> : 'Copied!!!'}
            </motion.div>
          </AnimatePresence>
        </Button>
      ) : (
        <BlockOpenTrigger asChild>
          <CircleButton layoutId="expand-button">
            <AnimatePresence>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Plus />
              </motion.div>
            </AnimatePresence>
          </CircleButton>
        </BlockOpenTrigger>
      )}
    </>
  )
}
