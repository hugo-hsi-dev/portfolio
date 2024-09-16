'use client'

import { cn } from '@/lib/classNameMerge'
import { PropsWithChildren, useEffect, useState } from 'react'

type TextUnderlineProps = PropsWithChildren & {
  className?: string
}

export default function TextUnderline({ children, className }: TextUnderlineProps) {
  const [isHoveredIn, setIsHoveredIn] = useState(false)
  const [isHoveredOut, setIsHoveredOut] = useState(false)

  const handleHover = () => {
    setIsHoveredIn(true)
  }

  const handleHoverExit = () => {
    setIsHoveredIn(false)
    setIsHoveredOut(true)
  }

  useEffect(() => {
    if (isHoveredOut) {
      const timer = setTimeout(() => {
        setIsHoveredOut(false)
      }, 300)

      return () => clearTimeout(timer)
    }
  }, [isHoveredOut])

  return (
    <div onMouseEnter={handleHover} onMouseLeave={handleHoverExit} className="overflow-hidden">
      <span className={className}>{children}</span>
      <div className="relative mt-1 h-1 w-full">
        <div
          className={cn(
            'absolute left-0 top-0 h-full w-full bg-fuchsia-500 transition-transform duration-300',
            isHoveredIn
              ? 'translate-x-0 transform opacity-100'
              : '-translate-x-full transform opacity-0',
          )}
        ></div>
        <div
          className={cn(
            'absolute left-0 top-0 h-full w-full translate-x-0 transform bg-fuchsia-500 opacity-0 transition-transform duration-300',
            isHoveredOut && 'translate-x-full opacity-100',
          )}
        ></div>
      </div>
    </div>
  )
}
