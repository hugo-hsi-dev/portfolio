'use client'

import { motion } from 'motion/react'
import { ReactNode } from 'react'

interface AnimatedTextProps {
  children: string
  className?: string
  delay?: number
  staggerChildren?: number
  type?: 'chars' | 'words' | 'lines'
}

export function AnimatedText({
  children,
  className = '',
  delay = 0,
  staggerChildren = 0.03,
  type = 'chars',
}: AnimatedTextProps) {
  const items = type === 'chars' ? children.split('') : children.split(' ')

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: delay,
        staggerChildren,
      },
    },
  }

  const child = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94] as const,
      },
    },
  }

  return (
    <motion.span
      className={`inline-block ${className}`}
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {items.map((item, index) => (
        <motion.span
          key={index}
          variants={child}
          className="inline-block"
          style={{ whiteSpace: type === 'words' && item === ' ' ? 'pre' : undefined }}
        >
          {item === ' ' ? '\u00A0' : item}
          {type === 'words' && index < items.length - 1 && '\u00A0'}
        </motion.span>
      ))}
    </motion.span>
  )
}

export function AnimatedName({
  firstName,
  lastName,
  className = '',
}: {
  firstName: string
  lastName: string
  className?: string
}) {
  return (
    <h1
      className={`font-serif text-[clamp(3rem,8vw,7rem)] leading-[0.9] tracking-tight ${className}`}
    >
      <motion.span
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="block"
      >
        {firstName}
      </motion.span>
      <motion.span
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="block"
      >
        {lastName}
      </motion.span>
    </h1>
  )
}
