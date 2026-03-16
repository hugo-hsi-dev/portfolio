'use client'

import { ScrollReveal } from '@/components/motion/ScrollReveal'
import { MagneticButton } from '@/components/motion/MouseEffects'
import { Envelope } from '@phosphor-icons/react'
import { SocialLinks } from '@/components/ui/SocialLinks'

interface FooterSectionProps {
  email?: string | null | undefined
  githubUrl?: string | null | undefined
  linkedinUrl?: string | null | undefined
}

export function FooterSection({ email, githubUrl, linkedinUrl }: FooterSectionProps) {
  return (
    <footer className="footer-fullscreen flex flex-col justify-end lg:block pt-16 pb-12 lg:py-24 xl:py-32 pl-8 pr-6 lg:px-12 bg-charcoal text-cream">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-16">
            <div>
              <h2 className="font-serif text-4xl lg:text-6xl tracking-tight mb-6">
                Let&apos;s work together
              </h2>
              <p className="font-sans text-lg text-stone-light max-w-md">
                I&apos;m currently available for full-time engineering roles. Based in NYC, open to
                remote opportunities.
              </p>
            </div>
            <div className="lg:text-right lg:flex lg:flex-col lg:justify-end">
              {email && (
                <MagneticButton
                  href={`mailto:${email}`}
                  className="inline-flex items-center gap-3 font-sans text-xl lg:text-2xl text-cream hover:text-gold transition-colors mb-4"
                >
                  <Envelope size={24} />
                  {email}
                </MagneticButton>
              )}
              <SocialLinks
                githubUrl={githubUrl}
                linkedinUrl={linkedinUrl}
                email={email}
                className="lg:justify-end"
              />
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="font-sans text-xs text-stone">
              &copy; {new Date().getFullYear()} Hugo Hsi. All rights reserved.
            </p>
            <p className="font-sans text-xs text-stone">
              Built with Next.js, TypeScript, and attention to detail.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </footer>
  )
}
