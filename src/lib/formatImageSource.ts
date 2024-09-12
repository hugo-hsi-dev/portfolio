export default function formatImageSource(src?: string | null) {
  if (!src) {
    throw new Error('invalid image url')
  }

  return `${process.env.NEXT_PUBLIC_SERVER_URL}${src}`
}
