'use client'

import { ComponentProps } from 'react'
import { ButtonHoverType, useButtonHoverContext } from './ButtonHoverContext'

type HoverButtonTriggerProps = ComponentProps<'div'> & {
  id: ButtonHoverType
}

export default function HoverButtonTrigger({
  id,
  onMouseOver,
  onMouseOut,
  ...props
}: HoverButtonTriggerProps) {
  const { setButtonHover } = useButtonHoverContext()
  return (
    <div
      {...props}
      onMouseOver={() => setButtonHover(id)}
      onMouseOut={() => setButtonHover(undefined)}
    />
  )
}
