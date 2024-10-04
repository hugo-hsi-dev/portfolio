'use server'

import { payload } from '@/lib/getServerPayload'

export async function getContacts() {
  return await payload.findGlobal({ slug: 'contacts' })
}
