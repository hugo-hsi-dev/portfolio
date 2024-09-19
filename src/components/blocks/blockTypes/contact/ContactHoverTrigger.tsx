'use client'

import { ComponentProps } from 'react'
import { ContactType, useContactHoverContext } from './contexts/ContactHoverContext'
import { Slot } from '@radix-ui/react-slot'

type ContactHoverTriggerProps = ComponentProps<'button'> & {
  id: ContactType
  asChild?: boolean
}

export default function ContactHoverTrigger({ id, asChild, ...props }: ContactHoverTriggerProps) {
  const { setHoveredContact } = useContactHoverContext()
  const Component = asChild ? Slot : 'button'
  return (
    <Component
      {...props}
      onMouseOver={() => setHoveredContact(id)}
      onMouseOut={() => setHoveredContact(undefined)}
    />
  )
}
