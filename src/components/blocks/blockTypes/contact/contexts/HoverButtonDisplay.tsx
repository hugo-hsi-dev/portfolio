'use client'

import { ComponentProps } from 'react'
import { useButtonHoverContext } from './ButtonHoverContext'

type HoverButtonDisplayProps = ComponentProps<'div'>

export default function HoverButtonDisplay(props: HoverButtonDisplayProps) {
  const { buttonHover } = useButtonHoverContext()
  return <>{buttonHover}</>
}
