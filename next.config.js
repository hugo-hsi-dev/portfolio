import { withPayload } from '@payloadcms/next/withPayload'

const NEXT_PUBLIC_VERCEL_URL = process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your Next.js config here
  images: {
    remotePatterns: [
      ...[NEXT_PUBLIC_VERCEL_URL /* 'https://example.com' */].map((item) => {
        const url = new URL(item)

        return {
          hostname: url.hostname,
          protocol: url.protocol.replace(':', ''),
        }
      }),
    ],
  },
  reactStrictMode: true,
  experimental: {
    reactCompiler: true,
  },
}

export default withPayload(nextConfig)
