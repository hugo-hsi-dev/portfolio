'use client'

import {
  ComponentProps,
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useState,
} from 'react'

type CopyEmailContextType = {
  isCopied: boolean
  setIsCopied: Dispatch<SetStateAction<boolean>>
} | null

const CopyEmailContext = createContext<CopyEmailContextType>(null)

export function useCopyEmailContext() {
  const context = useContext(CopyEmailContext)
  if (!context) {
    throw new Error('this component can only be used inside of CopyEmailProvider')
  }
  return context
}

type CopyEmailProviderProps = Omit<ComponentProps<typeof CopyEmailContext.Provider>, 'value'>

export default function CopyEmailProvider(props: CopyEmailProviderProps) {
  const [isCopied, setIsCopied] = useState(false)

  return <CopyEmailContext.Provider value={{ isCopied, setIsCopied }} {...props} />
}
