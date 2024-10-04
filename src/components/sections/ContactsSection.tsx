import ContactBlock from '@/components/blocks/contactBlock/ContactBlock'
import { getContacts } from '@/lib/queries'
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'

export const revalidate = 3600

export default async function ContactsSection() {
  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({
    queryKey: ['contacts'],
    queryFn: () => getContacts(),
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ContactBlock />
    </HydrationBoundary>
  )
}
