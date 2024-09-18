import ContactButton from '@/components/block/blockTypes/contact/defaultButtons/ContactDefaultButton'
import { useContactBlockContext } from '@/contexts/ContactBlockContext'
import { Mail } from 'lucide-react'

export default function EmailDefaultButton() {
  const { email, setHoveredItem, setIsCopied } = useContactBlockContext()
  function handleEmailClick() {
    navigator.clipboard.writeText(email)
    setIsCopied(true)
  }

  return (
    <ContactButton
      onClick={handleEmailClick}
      onMouseOver={() => setHoveredItem('Email')}
      onMouseOut={() => {
        setHoveredItem(undefined)
        setIsCopied(false)
      }}
    >
      <Mail />
    </ContactButton>
  )
}
