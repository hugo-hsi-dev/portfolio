import { RichText as PayloadRichText } from '@payloadcms/richtext-lexical/react'

interface RichTextProps {
  content: any | null | undefined
  className?: string
}

export function RichText({ content, className }: RichTextProps) {
  if (!content) return null

  return (
    <div className={className}>
      <PayloadRichText data={content} />
    </div>
  )
}
