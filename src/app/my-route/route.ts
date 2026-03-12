import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const GET = async () => {
  return Response.json({
    message: 'This is an example of a custom route.',
  })
}
