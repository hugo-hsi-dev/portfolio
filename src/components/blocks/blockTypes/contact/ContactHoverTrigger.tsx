'use client'

import { ComponentProps } from 'react'
import { ContactType, useContactHoverContext } from './contexts/ContactHoverContext'

type ContactHoverTriggerProps = ComponentProps<'div'> & {
  id: ContactType
}

export default function ContactHoverTrigger({
  id,
  onMouseOver,
  onMouseOut,
  ...props
}: ContactHoverTriggerProps) {
  const { setHoveredContact } = useContactHoverContext()
  return (
    <div
      {...props}
      onMouseOver={() => setHoveredContact(id)}
      onMouseOut={() => setHoveredContact(undefined)}
    />
  )
}
