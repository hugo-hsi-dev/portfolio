'use client'
import BlockContent from '@/components/block/BlockContent'
import HighlightBlockContextProvider from '@/contexts/HighlightBlockContext'
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
