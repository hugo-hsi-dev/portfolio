'use client'

import { LazyMotion, m, domAnimation } from 'motion/react'
import { useState } from 'react'
import type { Homepage } from '@/payload-types'
import { TypewriterText } from '@/components/motion/TypewriterText'
import { InkButton } from '@/components/motion/InkButton'
import { GrainOverlay } from '@/components/motion/GrainOverlay'
import { ScrollProgress } from '@/components/motion/ScrollProgress'
import { useReducedMotion } from '@/components/motion/ReducedMotionProvider'

interface HeroSectionProps {
  hero: Homepage['hero']
  resumeUrl?: string | null
}

function QuoteMarks({ text }: { text: string }) {
  return <span className="text-gold">{text}</span>
}

export function HeroSection({ hero, resumeUrl }: HeroSectionProps) {
  const [isTypingComplete, setIsTypingComplete] = useState(false)
  const { shouldReduceMotion } = useReducedMotion()

  if (!hero) return null

  return (
    <section className="min-h-screen flex flex-col justify-center pl-8 pr-6 lg:px-12 pt-24 pb-16 relative">
      <ScrollProgress />
      <GrainOverlay />

      <div className="max-w-6xl mx-auto w-full relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-end">
          <div className="lg:col-span-8">
            {hero.firstName && hero.lastName && (
              <LazyMotion features={domAnimation}>
                <m.p
                  id="hero-eyebrow"
                  className="font-sans text-sm uppercase tracking-[0.2em] text-stone mb-6"
                  initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  {hero.firstName} {hero.lastName}
                </m.p>
              </LazyMotion>
            )}
            {hero.tagline && (
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-charcoal leading-[1.1] mb-8 max-w-2xl">
                {shouldReduceMotion ? (
                  hero.tagline
                ) : (
                  <TypewriterText
                    text={hero.tagline}
                    delay={0.3}
                    speed={35}
                    onComplete={() => setIsTypingComplete(true)}
                  />
                )}
              </h1>
            )}
            {hero.intro && (
              <LazyMotion features={domAnimation}>
                <m.p
                  className="font-sans text-base text-slate max-w-lg leading-relaxed mb-10 text-pretty"
                  initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    duration: 0.5,
                    delay: shouldReduceMotion ? 0 : isTypingComplete ? 0.1 : 0,
                  }}
                >
                  {hero.intro}
                </m.p>
              </LazyMotion>
            )}
            <div className="flex flex-wrap gap-4">
              {hero.ctaPrimary?.text && hero.ctaPrimary?.link && (
                <LazyMotion features={domAnimation}>
                  <m.div
                    initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.35,
                      delay: shouldReduceMotion ? 0 : isTypingComplete ? 0.22 : 0,
                      ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                  >
                    <InkButton href={hero.ctaPrimary.link} ariaLabel="View my work">
                      {hero.ctaPrimary.text}
                    </InkButton>
                  </m.div>
                </LazyMotion>
              )}
              {hero.ctaSecondary?.text && resumeUrl && (
                <LazyMotion features={domAnimation}>
                  <m.div
                    initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.35,
                      delay: shouldReduceMotion ? 0 : isTypingComplete ? 0.37 : 0,
                      ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                  >
                    <InkButton href={resumeUrl} variant="outline" ariaLabel="Download resume">
                      {hero.ctaSecondary.text}
                    </InkButton>
                  </m.div>
                </LazyMotion>
              )}
            </div>
          </div>
          <div className="lg:col-span-4 lg:text-right">
            {hero.quote && (
              <LazyMotion features={domAnimation}>
                <m.p
                  className="font-serif text-sm text-stone italic leading-relaxed text-pretty"
                  initial={shouldReduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.45,
                    delay: shouldReduceMotion ? 0 : isTypingComplete ? 0.52 : 0,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                >
                  <QuoteMarks text="&ldquo;" />
                  {hero.quote}
                  <QuoteMarks text="&rdquo;" />
                </m.p>
              </LazyMotion>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
