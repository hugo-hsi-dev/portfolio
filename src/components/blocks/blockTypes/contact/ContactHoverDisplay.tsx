'use client'

import { ComponentProps } from 'react'
import { useContactHoverContext } from './contexts/ContactHoverContext'

type ContactHoverDisplayProps = ComponentProps<'div'>

export default function ContactHoverDisplay(props: ContactHoverDisplayProps) {
  const { hoveredContact } = useContactHoverContext()
  return <>{hoveredContact}</>
}
