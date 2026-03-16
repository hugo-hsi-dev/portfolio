'use client'

import { motion } from 'motion/react'
import { useState } from 'react'
import type { Homepage } from '@/payload-types'
import { TypewriterText } from '@/components/motion/TypewriterText'
import { InkButton } from '@/components/motion/InkButton'
import { GrainOverlay } from '@/components/motion/GrainOverlay'
import { ScrollProgress } from '@/components/motion/ScrollProgress'

interface HeroSectionProps {
  hero: Homepage['hero']
  resumeUrl?: string | null
}

function QuoteMarks({ text }: { text: string }) {
  return <span className="text-gold">{text}</span>
}

export function HeroSection({ hero, resumeUrl }: HeroSectionProps) {
  const [isTypingComplete, setIsTypingComplete] = useState(false)

  if (!hero) return null

  return (
    <section className="min-h-screen flex flex-col justify-center pl-8 pr-6 lg:px-12 pt-24 pb-16 relative">
      <ScrollProgress />
      <GrainOverlay />

      <div className="max-w-6xl mx-auto w-full relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-end">
          <div className="lg:col-span-8">
            {hero.firstName && hero.lastName && (
              <motion.p
                id="hero-eyebrow"
                className="font-sans text-sm uppercase tracking-[0.2em] text-stone mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                {hero.firstName} {hero.lastName}
              </motion.p>
            )}
            {hero.tagline && (
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-charcoal leading-[1.1] mb-8 max-w-2xl">
                <TypewriterText
                  text={hero.tagline}
                  delay={0.3}
                  speed={35}
                  onComplete={() => setIsTypingComplete(true)}
                />
              </h1>
            )}
            {hero.intro && (
              <motion.p
                className="font-sans text-base text-slate max-w-lg leading-relaxed mb-10 text-pretty"
                initial={{ opacity: 0 }}
                animate={isTypingComplete ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.5, delay: isTypingComplete ? 0.1 : 0 }}
              >
                {hero.intro}
              </motion.p>
            )}
            <div className="flex flex-wrap gap-4">
              {hero.ctaPrimary?.text && hero.ctaPrimary?.link && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={isTypingComplete ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                  transition={{
                    duration: 0.35,
                    delay: isTypingComplete ? 0.22 : 0,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                >
                  <InkButton href={hero.ctaPrimary.link}>{hero.ctaPrimary.text}</InkButton>
                </motion.div>
              )}
              {hero.ctaSecondary?.text && resumeUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={isTypingComplete ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                  transition={{
                    duration: 0.35,
                    delay: isTypingComplete ? 0.37 : 0,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                >
                  <InkButton href={resumeUrl} variant="outline">
                    {hero.ctaSecondary.text}
                  </InkButton>
                </motion.div>
              )}
            </div>
          </div>
          <div className="lg:col-span-4 lg:text-right">
            {hero.quote && (
              <motion.p
                className="font-serif text-sm text-stone italic leading-relaxed text-pretty"
                initial={{ opacity: 0, x: 20 }}
                animate={isTypingComplete ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                transition={{
                  duration: 0.45,
                  delay: isTypingComplete ? 0.52 : 0,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              >
                <QuoteMarks text="&ldquo;" />
                {hero.quote}
                <QuoteMarks text="&rdquo;" />
              </motion.p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
