'use client'

import {
  ComponentProps,
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useState,
} from 'react'

type HoveredItemType = 'Email' | 'Github' | 'Linkedin' | undefined

type ContactBlockContextType = {
  email: string
  githubUrl: string
  linkedinUrl: string
  hoveredItem: HoveredItemType
  setHoveredItem: Dispatch<SetStateAction<HoveredItemType>>
  isCopied: boolean
  setIsCopied: Dispatch<SetStateAction<boolean>>
} | null

const ContactBlockContext = createContext<ContactBlockContextType>(null)

export function useContactBlockContext() {
  const context = useContext(ContactBlockContext)
  if (!context) {
    throw new Error('useContactBlockContext can only be used in the ContactBlockContext provider')
  }
  return context
}

type ContactBlockProviderProps = Omit<
  ComponentProps<typeof ContactBlockContext.Provider>,
  'value'
> & {
  email: string
  githubUrl: string
  linkedinUrl: string
}

export default function ContactBlockProvider({
  email,
  githubUrl,
  linkedinUrl,
  ...props
}: ContactBlockProviderProps) {
  const [hoveredItem, setHoveredItem] = useState<HoveredItemType>()
  const [isCopied, setIsCopied] = useState(false)

  return (
    <ContactBlockContext.Provider
      value={{ email, githubUrl, linkedinUrl, hoveredItem, setHoveredItem, isCopied, setIsCopied }}
      {...props}
    />
  )
}
