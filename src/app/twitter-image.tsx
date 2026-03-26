import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
  width: 1200,
  height: 630,
}

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        backgroundColor: '#f8f6f1',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Georgia, serif',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#e8e4db',
          opacity: 0.3,
          backgroundImage:
            'radial-gradient(circle at 70% 30%, rgba(196, 163, 90, 0.1) 0%, transparent 50%)',
        }}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '24px',
          zIndex: 1,
        }}
      >
        <h1
          style={{
            fontSize: '72px',
            fontWeight: 400,
            color: '#1a1a1a',
            letterSpacing: '-0.02em',
            margin: 0,
          }}
        >
          Hugo Hsi
        </h1>
        <div
          style={{
            width: '80px',
            height: '2px',
            backgroundColor: '#c4a35a',
          }}
        />
        <p
          style={{
            fontSize: '32px',
            fontWeight: 400,
            color: '#5a5a5a',
            margin: 0,
            fontFamily: 'system-ui, sans-serif',
            letterSpacing: '0.02em',
          }}
        >
          Full-Stack Developer
        </p>
        <p
          style={{
            fontSize: '20px',
            fontWeight: 400,
            color: '#8b8680',
            margin: 0,
            fontFamily: 'system-ui, sans-serif',
            letterSpacing: '0.05em',
          }}
        >
          React · Next.js · Node.js
        </p>
      </div>
    </div>,
    {
      ...size,
    },
  )
}
