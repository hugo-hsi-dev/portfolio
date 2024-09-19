'use client'

import { ComponentProps, createContext, useContext } from 'react'
import { Contact } from '@/payload-types'

const ContactDataContext = createContext<Contact | null>(null)

export function useContactDataContext() {
  const context = useContext(ContactDataContext)
  if (!context) {
    throw new Error('useContactDataContext can only be used in the ContactDataContext provider')
  }
  return context
}

type ContactDataContextProviderProps = Omit<
  ComponentProps<typeof ContactDataContext.Provider>,
  'value'
> &
  Contact

export default function ContactDataContextProvider({
  id,
  email,
  githubUrl,
  linkedinUrl,
  ...props
}: ContactDataContextProviderProps) {
  return <ContactDataContext.Provider value={{ id, email, githubUrl, linkedinUrl }} {...props} />
}
