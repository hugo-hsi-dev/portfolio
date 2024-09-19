'use client'

import {
  ComponentProps,
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useState,
} from 'react'

export type ContactType = 'Email' | 'Github' | 'Linkedin' | undefined

type ContactHoverContextType = {
  hoveredContact: ContactType
  setHoveredContact: Dispatch<SetStateAction<ContactType>>
} | null

const ContactHoverContext = createContext<ContactHoverContextType>(null)

export function useContactHoverContext() {
  const context = useContext(ContactHoverContext)
  if (!context) {
    throw new Error('this component can only be used in ContactHoverContextProvider')
  }
  return context
}

type ContactHoverProviderProps = Omit<ComponentProps<typeof ContactHoverContext.Provider>, 'value'>

export default function ButtonHoverProvider(props: ContactHoverProviderProps) {
  const [hoveredContact, setHoveredContact] = useState<ContactType>()
  return <ContactHoverContext.Provider value={{ hoveredContact, setHoveredContact }} {...props} />
}
