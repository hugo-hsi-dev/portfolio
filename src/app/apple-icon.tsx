import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
  width: 180,
  height: 180,
}

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Georgia, serif',
        backgroundColor: '#f8f6f1',
      }}
    >
      <div
        style={{
          fontSize: '120px',
          fontWeight: 'bold',
          color: '#1a1a1a',
          letterSpacing: '-0.05em',
          lineHeight: 1,
        }}
      >
        H
      </div>
    </div>,
    {
      ...size,
    },
  )
}
