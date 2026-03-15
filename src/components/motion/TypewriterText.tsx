'use client'

import { useState, useEffect, useRef } from 'react'
import { useInView } from 'motion/react'

interface TypewriterTextProps {
  text: string
  className?: string
  delay?: number
  speed?: number
}

export function TypewriterText({
  text,
  className = '',
  delay = 0,
  speed = 40,
}: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [showCursor, setShowCursor] = useState(true)
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.5 })
  const hasStarted = useRef(false)

  useEffect(() => {
    if (!isInView || hasStarted.current || !text) return
    hasStarted.current = true

    const startTimeout = setTimeout(() => {
      let index = 0
      const interval = setInterval(() => {
        if (index <= text.length) {
          setDisplayedText(text.slice(0, index))
          index++
        } else {
          clearInterval(interval)
        }
      }, speed)

      return () => clearInterval(interval)
    }, delay * 1000)

    return () => clearTimeout(startTimeout)
  }, [isInView, text, delay, speed])

  // Blink cursor
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor((prev) => !prev)
    }, 530)
    return () => clearInterval(interval)
  }, [])

  return (
    <span ref={ref} className={className}>
      {displayedText}
      <span
        className={`inline-block w-[2px] h-[1em] bg-current ml-1 transition-opacity duration-100 ${showCursor ? 'opacity-100' : 'opacity-0'}`}
      />
    </span>
  )
}
