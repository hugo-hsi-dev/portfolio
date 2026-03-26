'use client'

import { useReducer, useEffect, useRef } from 'react'
import { useInView } from 'motion/react'

interface TypewriterTextProps {
  text: string
  className?: string
  delay?: number
  speed?: number
  onComplete?: () => void
}

type State = {
  displayedText: string
  showCursor: boolean
  isComplete: boolean
}

type Action =
  | { type: 'APPEND_CHAR'; char: string }
  | { type: 'TOGGLE_CURSOR' }
  | { type: 'COMPLETE' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'APPEND_CHAR':
      return { ...state, displayedText: state.displayedText + action.char }
    case 'TOGGLE_CURSOR':
      return { ...state, showCursor: !state.showCursor }
    case 'COMPLETE':
      return { ...state, isComplete: true }
    default:
      return state
  }
}

export function TypewriterText({
  text,
  className = '',
  delay = 0,
  speed = 40,
  onComplete,
}: TypewriterTextProps) {
  const [state, dispatch] = useReducer(reducer, {
    displayedText: '',
    showCursor: true,
    isComplete: false,
  })
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.5 })
  const hasStarted = useRef(false)
  const typeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const cursorIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!isInView || hasStarted.current || !text) return
    hasStarted.current = true

    const startTimeout = setTimeout(() => {
      let index = 0
      typeIntervalRef.current = setInterval(() => {
        if (index < text.length) {
          dispatch({ type: 'APPEND_CHAR', char: text[index] })
          index++
        } else {
          clearInterval(typeIntervalRef.current!)
          typeIntervalRef.current = null
          dispatch({ type: 'COMPLETE' })
          onComplete?.()
        }
      }, speed)
    }, delay * 1000)

    return () => {
      clearTimeout(startTimeout)
      if (typeIntervalRef.current) {
        clearInterval(typeIntervalRef.current)
      }
    }
  }, [isInView, text, delay, speed, onComplete])

  // Blink cursor
  useEffect(() => {
    cursorIntervalRef.current = setInterval(() => {
      dispatch({ type: 'TOGGLE_CURSOR' })
    }, 530)
    return () => {
      if (cursorIntervalRef.current) {
        clearInterval(cursorIntervalRef.current)
      }
    }
  }, [])

  return (
    <span ref={ref} className={className}>
      {state.displayedText}
      <span
        className={`inline-block w-[2px] h-[1cap] bg-current ml-1 vertical-align-baseline transition-opacity duration-100 ${state.showCursor ? 'opacity-100' : 'opacity-0'}`}
      />
    </span>
  )
}
