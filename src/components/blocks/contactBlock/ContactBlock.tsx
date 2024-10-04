'use client'

import Block from '@/components/blocks/primitives/Block'
import { getContacts } from '@/lib/queries'
import { useQuery } from '@tanstack/react-query'

export default function ContactBlock() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => getContacts(),
  })

  if (isError) {
    return (
      <Block id="contact" className="bg-black text-white">
        Error!
      </Block>
    )
  }

  return (
    <Block id="contact" className="bg-black text-white">
      {data?.githubUrl}
    </Block>
  )
}
