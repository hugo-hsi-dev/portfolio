'use client'

import { ComponentProps } from 'react'
import { useCopyEmailContext } from './contexts/CopyEmailContext'
import { Slot } from '@radix-ui/react-slot'
import { useContactDataContext } from './contexts/ContactDataContext'

type CopyEmailTriggerProps = ComponentProps<'button'> & { asChild?: boolean }

export default function CopyEmailTrigger({ asChild, ...props }: CopyEmailTriggerProps) {
  const { setIsCopied } = useCopyEmailContext()
  const { email } = useContactDataContext()
  const Component = asChild ? Slot : 'button'

  function handleClick() {
    setIsCopied(true)
    navigator.clipboard.writeText(email)
  }

  return <Component onClick={handleClick} onMouseLeave={() => setIsCopied(false)} {...props} />
}
