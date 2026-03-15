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
    <footer className="py-24 lg:py-32 pl-8 pr-6 lg:px-12 bg-[#1a1a1a] text-[#f8f6f1]">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-16">
            <div>
              <h2 className="font-serif text-4xl lg:text-6xl tracking-tight mb-6">
                Let&apos;s work together
              </h2>
              <p className="font-sans text-lg text-[#b8b4ab] max-w-md">
                I&apos;m currently available for full-time engineering roles. Based in NYC, open to
                remote opportunities.
              </p>
            </div>
            <div className="lg:text-right lg:flex lg:flex-col lg:justify-end">
              {email && (
                <MagneticButton
                  href={`mailto:${email}`}
                  className="inline-flex items-center gap-3 font-sans text-xl lg:text-2xl text-[#f8f6f1] hover:text-[#c4a35a] transition-colors mb-4"
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
          <div className="pt-8 border-t border-[#333] flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="font-sans text-xs text-[#8b8680]">
              &copy; {new Date().getFullYear()} Hugo Hsi. All rights reserved.
            </p>
            <p className="font-sans text-xs text-[#8b8680]">
              Built with Next.js, TypeScript, and attention to detail.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </footer>
  )
}
