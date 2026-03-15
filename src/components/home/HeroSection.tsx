'use client'

import { AnimatedName } from '@/components/motion/AnimatedText'
import { TypewriterText } from '@/components/motion/TypewriterText'
import { InkButton } from '@/components/motion/InkButton'
import { GrainOverlay } from '@/components/motion/GrainOverlay'
import { ScrollProgress } from '@/components/motion/ScrollProgress'
import { RichText } from '@/components/RichText'
import type { Homepage } from '@/payload-types'

interface HeroSectionProps {
  hero: Homepage['hero']
  resumeUrl?: string | null
}

function QuoteMarks({ text }: { text: string }) {
  return <span className="text-[#c4a35a] animate-pulse-slow">{text}</span>
}

export function HeroSection({ hero, resumeUrl }: HeroSectionProps) {
  if (!hero) return null

  return (
    <section className="min-h-screen flex flex-col justify-center px-6 lg:px-12 pt-24 pb-16 relative">
      <ScrollProgress />
      <GrainOverlay opacity={0.02} />

      <div className="max-w-6xl mx-auto w-full relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-end">
          <div className="lg:col-span-7">
            {hero.role && (
              <p className="font-sans text-xs uppercase tracking-[0.3em] text-[#8b8680] mb-6">
                {hero.role}
              </p>
            )}
            {hero.firstName && hero.lastName && (
              <AnimatedName firstName={hero.firstName} lastName={hero.lastName} className="mb-8" />
            )}
            {hero.tagline && (
              <p className="font-serif text-2xl lg:text-3xl text-[#4a4a4a] max-w-xl leading-snug mb-8">
                <TypewriterText text={hero.tagline} delay={1} speed={30} />
              </p>
            )}
            {hero.intro && (
              <div className="font-sans text-base lg:text-lg text-[#5a5a5a] max-w-xl leading-relaxed mb-10">
                <RichText content={hero.intro} />
              </div>
            )}
            {(hero.ctaPrimary?.text || hero.ctaSecondary?.text) && (
              <div className="flex flex-wrap gap-4">
                {hero.ctaPrimary?.text && hero.ctaPrimary?.link && (
                  <InkButton href={hero.ctaPrimary.link}>{hero.ctaPrimary.text}</InkButton>
                )}
                {hero.ctaSecondary?.text && (
                  <InkButton href={resumeUrl || '#'} variant="outline">
                    {hero.ctaSecondary.text}
                  </InkButton>
                )}
              </div>
            )}
          </div>
          <div className="lg:col-span-5 lg:text-right">
            {hero.quote && (
              <p className="font-serif text-sm text-[#8b8680] italic">
                <QuoteMarks text="&ldquo;" />
                {hero.quote}
                <QuoteMarks text="&rdquo;" />
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
