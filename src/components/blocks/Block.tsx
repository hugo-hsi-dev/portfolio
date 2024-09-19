'use client'
import BlockContent from '@/components/blocks/BlockContent'
import HighlightBlockContextProvider from '@/components/blocks/contexts/HighlightBlockContext'
import { ComponentProps, ReactNode } from 'react'

type BlockProps = ComponentProps<typeof BlockContent> & {
  id: string
  cols?: number
  rows?: number
  defaultComponent: ReactNode
  expandedComponent: ReactNode
}

export default function Block(props: BlockProps) {
  return (
    <HighlightBlockContextProvider id={props.id}>
      <BlockContent {...props} />
    </HighlightBlockContextProvider>
  )
}
