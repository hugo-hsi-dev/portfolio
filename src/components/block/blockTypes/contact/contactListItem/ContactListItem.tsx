import { PropsWithChildren } from 'react'

type ContactListItemProps = PropsWithChildren

export default function ContactListItem({ children }: ContactListItemProps) {
  return <li className="flex gap-12 items-center">{children}</li>
}
