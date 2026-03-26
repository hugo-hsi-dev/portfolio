'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useReducedMotion as useMotionReducedMotion } from 'motion/react'

interface ReducedMotionContextType {
  shouldReduceMotion: boolean
}

const ReducedMotionContext = createContext<ReducedMotionContextType>({
  shouldReduceMotion: false,
})

export function useReducedMotion() {
  return useContext(ReducedMotionContext)
}

interface ReducedMotionProviderProps {
  children: ReactNode
}

export function ReducedMotionProvider({ children }: ReducedMotionProviderProps) {
  const shouldReduceMotion = useMotionReducedMotion() ?? false

  return (
    <ReducedMotionContext.Provider value={{ shouldReduceMotion }}>
      {children}
    </ReducedMotionContext.Provider>
  )
}
