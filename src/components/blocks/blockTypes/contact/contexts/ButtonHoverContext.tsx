'use client'

import {
  ComponentProps,
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useState,
} from 'react'

export type ButtonHoverType = 'Email' | 'Github' | 'Linkedin' | undefined

type ButtonHoverContextType = {
  buttonHover: ButtonHoverType
  setButtonHover: Dispatch<SetStateAction<ButtonHoverType>>
} | null

const ButtonHoverContext = createContext<ButtonHoverContextType>(null)

export function useButtonHoverContext() {
  const context = useContext(ButtonHoverContext)
  if (!context) {
    throw new Error('useButtonHoverContext can only be used in the ButtonHoverContext provider')
  }
  return context
}

type ButtonHoverContextProviderProps = Omit<
  ComponentProps<typeof ButtonHoverContext.Provider>,
  'value'
>

export default function ButtonHoverContextProvider(props: ButtonHoverContextProviderProps) {
  const [buttonHover, setButtonHover] = useState<ButtonHoverType>()
  return <ButtonHoverContext.Provider value={{ buttonHover, setButtonHover }} {...props} />
}
