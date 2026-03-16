'use client'

import { ReactNode } from 'react'

export function AnimatedUnderline({ children }: { children: ReactNode }) {
  return (
    <span className="relative inline-block group">
      <span className="relative">
        {children}
        <span className="absolute bottom-0 left-0 w-full h-[1px] bg-current origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
      </span>
    </span>
  )
}
