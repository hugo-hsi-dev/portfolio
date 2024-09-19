'use client'

import {
  ComponentProps,
  createContext,
  createRef,
  Dispatch,
  RefObject,
  SetStateAction,
  useContext,
  useState,
} from 'react'

type ExpandedBlockContextType = {
  expandedBlock?: string
  setExpandedBlock: Dispatch<SetStateAction<string | undefined>>
  ref: RefObject<HTMLDivElement | null>
} | null

const ExpandedBlockContext = createContext<ExpandedBlockContextType>(null)
const ref = createRef<HTMLDivElement>()

export function useExpandedBlockContext() {
  const context = useContext(ExpandedBlockContext)
  if (!context) {
    throw new Error('useExpandedBlockContext can only be used in the ExpandedBlockContext provider')
  }
  return context
}

type ExpandedBlockContextProviderProps = Omit<
  ComponentProps<typeof ExpandedBlockContext.Provider>,
  'value'
>

export default function ExpandedBlockContextProvider(props: ExpandedBlockContextProviderProps) {
  const [expandedBlock, setExpandedBlock] = useState<undefined | string>()
  return (
    <ExpandedBlockContext.Provider value={{ expandedBlock, setExpandedBlock, ref }} {...props} />
  )
}
