'use client'

import {
  ComponentProps,
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useState,
} from 'react'

type HighlightBlockContextType = {
  id: string
  highlightBlock: boolean
  setHighlightBlock: Dispatch<SetStateAction<boolean>>
} | null

const HighlightBlockContext = createContext<HighlightBlockContextType>(null)

export function useHighlightBlockContext() {
  const context = useContext(HighlightBlockContext)
  if (!context) {
    throw new Error('useHighlightBlockContext can only be used inside of BlockContextProvider')
  }
  return context
}

type HighlightBlockContextProviderProps = Omit<
  ComponentProps<typeof HighlightBlockContext.Provider>,
  'value'
> & {
  id: string
}

export default function HighlightBlockContextProvider({
  id,
  ...props
}: HighlightBlockContextProviderProps) {
  const [highlightBlock, setHighlightBlock] = useState(false)
  return (
    <HighlightBlockContext.Provider value={{ id, highlightBlock, setHighlightBlock }} {...props} />
  )
}
