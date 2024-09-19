'use client'

import React from 'react'

import HoverButtonDisplay from './ContactHoverDisplay'
import { Github, Linkedin, Mail, Plus } from 'lucide-react'
import CircleButton from '@/components/buttons/CircleButton'
import Button from '@/components/buttons/Button'
import { AnimatePresence, motion } from 'framer-motion'
import BlockOpenTrigger from '../../BlockOpenTrigger'
import AddButton from './default/ContactHoverDisplayButton'
import ContactHoverTrigger from './ContactHoverTrigger'
import CopyEmailTrigger from './CopyEmailTrigger'

export default function Default() {
  return (
    <div className="flex flex-col justify-between h-full">
      <div className="relative h-full">
        <div className="absolute left-1/2 top-1/2 -translate-y-2/4 -translate-x-2/4">
          <AddButton />
        </div>
      </div>
      <div className="flex justify-between items-end w-full">
        <CopyEmailTrigger asChild>
          <ContactHoverTrigger id="Email" asChild>
            <Button>
              <Mail />
            </Button>
          </ContactHoverTrigger>
        </CopyEmailTrigger>
        <ContactHoverTrigger id="Github">
          <Github />
        </ContactHoverTrigger>
        <ContactHoverTrigger id="Linkedin">
          <Linkedin />
        </ContactHoverTrigger>
      </div>
    </div>
  )
}
