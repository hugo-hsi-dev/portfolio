'use client'
import HighlightBlockContextProvider from '@/components/blocks/contexts/HighlightBlockContext'
import BlockContent from '@/components/blocks/primitives/BlockContent'
import { ComponentProps } from 'react'

type BlockProps = ComponentProps<typeof BlockContent> & {
  id: string
  cols?: number
  rows?: number
}

export default function Block({ id, ...props }: BlockProps) {
  return (
    <HighlightBlockContextProvider id={id}>
      <BlockContent id={id} {...props} />
    </HighlightBlockContextProvider>
  )
}
