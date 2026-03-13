'use client'

import React from 'react'
import { motion, useMotionValue, useSpring } from 'motion/react'
import { useRef, useEffect, useState, useCallback } from 'react'
import {
  ArrowDown,
  GithubLogo,
  LinkedinLogo,
  Envelope,
  ArrowSquareOut,
} from '@phosphor-icons/react'
import { ScrollReveal } from '@/components/motion/ScrollReveal'
import { StaggerContainer, StaggerItem } from '@/components/motion/StaggerContainer'
import { AnimatedName } from '@/components/motion/AnimatedText'
import { TypewriterText } from '@/components/motion/TypewriterText'
import { InkButton } from '@/components/motion/InkButton'
import { GrainOverlay } from '@/components/motion/GrainOverlay'
import { ScrollProgress } from '@/components/motion/ScrollProgress'
import { MagneticButton, MouseFollower } from '@/components/motion/MouseEffects'

function AnimatedUnderline({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative inline-block group">
      <span className="relative">
        {children}
        <motion.span
          className="absolute bottom-0 left-0 w-full h-[1px] bg-current origin-left"
          initial={{ scaleX: 0 }}
          whileHover={{ scaleX: 1 }}
          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
      </span>
    </span>
  )
}

function ImageLift({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      className={`relative overflow-hidden ${className}`}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  )
}

function QuoteMarks({ text }: { text: string }) {
  return <span className="text-[#c4a35a] animate-pulse-slow">{text}</span>
}

function MouseFollowHighlight() {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const ref = useRef<HTMLDivElement>(null)

  const smoothX = useSpring(mouseX, { stiffness: 50, damping: 20 })
  const smoothY = useSpring(mouseY, { stiffness: 50, damping: 20 })

  useEffect(() => {
    let rafId: number
    let lastX = 0
    let lastY = 0

    const handleMouseMove = (e: MouseEvent) => {
      if (!ref.current) return
      const rect = ref.current.getBoundingClientRect()
      const newX = e.clientX - rect.left
      const newY = e.clientY - rect.top

      // Throttle to every 2nd frame (~30fps)
      if (Math.abs(newX - lastX) > 5 || Math.abs(newY - lastY) > 5) {
        cancelAnimationFrame(rafId)
        rafId = requestAnimationFrame(() => {
          mouseX.set(newX - 300)
          mouseY.set(newY - 300)
          lastX = newX
          lastY = newY
        })
      }
    }

    const element = ref.current
    if (element) {
      element.addEventListener('mousemove', handleMouseMove, { passive: true })
    }
    return () => {
      if (element) {
        element.removeEventListener('mousemove', handleMouseMove)
      }
      cancelAnimationFrame(rafId)
    }
  }, [mouseX, mouseY])

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full blur-[120px] opacity-15 bg-[#c4a35a]"
        style={{
          x: smoothX,
          y: smoothY,
          willChange: 'transform',
        }}
      />
    </div>
  )
}

export default function RichHomePage() {
  return (
    <div className="min-h-screen bg-[#f8f6f1] text-[#1a1a1a] overflow-x-hidden">
      <ScrollProgress />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 mix-blend-difference">
        <div className="flex justify-between items-center px-6 lg:px-12 py-6">
          <MagneticButton
            href="#"
            className="font-serif text-xl tracking-tight text-white"
            intensity={0.2}
          >
            Hugo Hsi
          </MagneticButton>
          <div className="flex items-center gap-6">
            <MagneticButton
              href="https://github.com"
              className="text-white/80 hover:text-white transition-colors"
              intensity={0.3}
            >
              <GithubLogo size={20} />
            </MagneticButton>
            <MagneticButton
              href="https://linkedin.com"
              className="text-white/80 hover:text-white transition-colors"
              intensity={0.3}
            >
              <LinkedinLogo size={20} />
            </MagneticButton>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex flex-col justify-center px-6 lg:px-12 pt-24 pb-16 relative">
        <GrainOverlay opacity={0.02} />
        <MouseFollowHighlight />

        <div className="max-w-6xl mx-auto w-full relative z-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-end">
            <div className="lg:col-span-7">
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="font-sans text-xs uppercase tracking-[0.3em] text-[#8b8680] mb-6"
              >
                Full-Stack Developer
              </motion.p>
              <AnimatedName firstName="Hugo" lastName="Hsi" className="mb-8" />
              <p className="font-serif text-2xl lg:text-3xl text-[#4a4a4a] max-w-xl leading-snug mb-8">
                <TypewriterText
                  text="Full-stack developer with a designer's eye."
                  delay={1}
                  speed={30}
                />
              </p>
              <p className="font-sans text-base lg:text-lg text-[#5a5a5a] max-w-xl leading-relaxed mb-10">
                Graphic design degree turned full-stack engineer. I ship production code with an
                understanding of why it&apos;s designed that way. Building with React, Next.js,
                TypeScript, and Node.js. Formerly shipping client work at Praxis Loop.
              </p>
              <div className="flex flex-wrap gap-4">
                <InkButton href="#projects">
                  View my work
                  <ArrowDown size={16} />
                </InkButton>
                <InkButton href="/resume.pdf" variant="outline">
                  Download resume
                </InkButton>
              </div>
            </div>
            <div className="lg:col-span-5 lg:text-right">
              <p className="font-serif text-sm text-[#8b8680] italic">
                <QuoteMarks text="&ldquo;" />
                My design training means I don&apos;t just build what&apos;s specced — I understand
                why it&apos;s specced that way.
                <QuoteMarks text="&rdquo;" />
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section id="projects" className="py-24 lg:py-32 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal className="flex items-baseline justify-between mb-16">
            <h2 className="font-serif text-4xl lg:text-5xl tracking-tight">Selected Work</h2>
            <span className="font-sans text-xs uppercase tracking-[0.2em] text-[#8b8680]">
              3 Projects
            </span>
          </ScrollReveal>

          <div className="space-y-20">
            {/* Project 1 */}
            <article className="group">
              <a href="#" className="block">
                <StaggerContainer className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                  <StaggerItem className="lg:col-span-7">
                    <ImageLift className="bg-[#e8e4db] aspect-[16/10]">
                      <div className="absolute inset-0 flex items-center justify-center text-[#b8b4ab] font-serif text-lg">
                        [Project Screenshot]
                      </div>
                    </ImageLift>
                  </StaggerItem>
                  <StaggerItem className="lg:col-span-5 lg:pt-4">
                    <span className="font-sans text-xs uppercase tracking-[0.2em] text-[#c4a35a] mb-3 block">
                      Client Work at Praxis Loop
                    </span>
                    <h3 className="font-serif text-2xl lg:text-3xl mb-3 group-hover:translate-x-1 transition-transform">
                      National Medal of Honor Museum
                    </h3>
                    <p className="font-sans text-[#5a5a5a] mb-4 leading-relaxed">
                      Complete CMS migration from WordPress to Prismic. Migrated content
                      architecture, rebuilt component library, and maintained SEO rankings
                      throughout transition.
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {['Next.js', 'Prismic', 'TypeScript', 'Tailwind'].map((tech) => (
                        <span
                          key={tech}
                          className="font-sans text-xs px-2 py-1 bg-[#e8e4db] text-[#5a5a5a]"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                    <span className="inline-flex items-center gap-1 font-sans text-sm text-[#1a1a1a] group-hover:gap-2 transition-all">
                      <AnimatedUnderline>View case study</AnimatedUnderline>
                      <ArrowSquareOut size={14} />
                    </span>
                  </StaggerItem>
                </StaggerContainer>
              </a>
            </article>

            {/* Project 2 */}
            <article className="group">
              <a href="#" className="block">
                <StaggerContainer className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                  <StaggerItem className="lg:col-span-7">
                    <ImageLift className="bg-[#e8e4db] aspect-[16/10]">
                      <div className="absolute inset-0 flex items-center justify-center text-[#b8b4ab] font-serif text-lg">
                        [Project Screenshot]
                      </div>
                    </ImageLift>
                  </StaggerItem>
                  <StaggerItem className="lg:col-span-5 lg:pt-4">
                    <span className="font-sans text-xs uppercase tracking-[0.2em] text-[#c4a35a] mb-3 block">
                      Client Work at Praxis Loop
                    </span>
                    <h3 className="font-serif text-2xl lg:text-3xl mb-3 group-hover:translate-x-1 transition-transform">
                      1st Avenue Advisors
                    </h3>
                    <p className="font-sans text-[#5a5a5a] mb-4 leading-relaxed">
                      Client-facing pages with pixel-perfect Figma-to-code implementation. Built
                      working contact forms, dynamic content sections, and responsive layouts.
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {['React', 'TypeScript', 'Node.js', 'PostgreSQL'].map((tech) => (
                        <span
                          key={tech}
                          className="font-sans text-xs px-2 py-1 bg-[#e8e4db] text-[#5a5a5a]"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                    <span className="inline-flex items-center gap-1 font-sans text-sm text-[#1a1a1a] group-hover:gap-2 transition-all">
                      <AnimatedUnderline>View case study</AnimatedUnderline>
                      <ArrowSquareOut size={14} />
                    </span>
                  </StaggerItem>
                </StaggerContainer>
              </a>
            </article>

            {/* Project 3 */}
            <article className="group">
              <a href="#" className="block">
                <StaggerContainer className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                  <StaggerItem className="lg:col-span-7">
                    <ImageLift className="bg-[#e8e4db] aspect-[16/10]">
                      <div className="absolute inset-0 flex items-center justify-center text-[#b8b4ab] font-serif text-lg">
                        [Project Screenshot]
                      </div>
                    </ImageLift>
                  </StaggerItem>
                  <StaggerItem className="lg:col-span-5 lg:pt-4">
                    <span className="font-sans text-xs uppercase tracking-[0.2em] text-[#7a9a8a] mb-3 block">
                      Personal Project
                    </span>
                    <h3 className="font-serif text-2xl lg:text-3xl mb-3 group-hover:translate-x-1 transition-transform">
                      Content API Platform
                    </h3>
                    <p className="font-sans text-[#5a5a5a] mb-4 leading-relaxed">
                      Full-stack API service with authentication, rate limiting, and webhook
                      support. Demonstrates backend architecture and database design beyond frontend
                      work.
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {['Node.js', 'MongoDB', 'Redis', 'Docker'].map((tech) => (
                        <span
                          key={tech}
                          className="font-sans text-xs px-2 py-1 bg-[#e8e4db] text-[#5a5a5a]"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                    <span className="inline-flex items-center gap-1 font-sans text-sm text-[#1a1a1a] group-hover:gap-2 transition-all">
                      <AnimatedUnderline>View case study</AnimatedUnderline>
                      <ArrowSquareOut size={14} />
                    </span>
                  </StaggerItem>
                </StaggerContainer>
              </a>
            </article>
          </div>
        </div>
      </section>

      {/* Credibility Bar */}
      <section className="py-24 lg:py-32 px-6 lg:px-12 bg-[#1a1a1a] text-[#f8f6f1]">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              <div>
                <span className="font-sans text-xs uppercase tracking-[0.3em] text-[#8b8680] mb-6 block">
                  Experience
                </span>
                <h3 className="font-serif text-2xl lg:text-3xl mb-4">Full-Stack Developer</h3>
                <p className="font-sans text-lg text-[#c4a35a] mb-2">Praxis Loop</p>
                <p className="font-sans text-sm text-[#8b8680] mb-4">2023 — Present</p>
                <p className="font-sans text-[#b8b4ab] leading-relaxed">
                  Shipped client websites, led CMS migrations, translated Figma designs to
                  production code. Worked directly with clients to understand requirements and
                  deliver solutions.
                </p>
              </div>
              <div>
                <span className="font-sans text-xs uppercase tracking-[0.3em] text-[#8b8680] mb-6 block">
                  Education
                </span>
                <h3 className="font-serif text-2xl lg:text-3xl mb-4">BFA in Graphic Design</h3>
                <p className="font-sans text-[#b8b4ab] leading-relaxed">
                  Four years of design training. Typography, layout, color theory, visual hierarchy
                  — skills that translate directly to building better interfaces.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-24 lg:py-32 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal className="mb-16">
            <h2 className="font-serif text-4xl lg:text-5xl tracking-tight">Tech Stack</h2>
          </ScrollReveal>

          <ScrollReveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
              <div>
                <h3 className="font-sans text-xs uppercase tracking-[0.2em] text-[#8b8680] mb-4">
                  Frontend
                </h3>
                <ul className="font-sans text-base space-y-2">
                  <li>React</li>
                  <li>Next.js</li>
                  <li>Svelte</li>
                  <li>Tailwind CSS</li>
                </ul>
              </div>
              <div>
                <h3 className="font-sans text-xs uppercase tracking-[0.2em] text-[#8b8680] mb-4">
                  Backend
                </h3>
                <ul className="font-sans text-base space-y-2">
                  <li>Node.js</li>
                  <li>TypeScript</li>
                  <li>Express</li>
                </ul>
              </div>
              <div>
                <h3 className="font-sans text-xs uppercase tracking-[0.2em] text-[#8b8680] mb-4">
                  Data
                </h3>
                <ul className="font-sans text-base space-y-2">
                  <li>PostgreSQL</li>
                  <li>MongoDB</li>
                  <li>Redis</li>
                </ul>
              </div>
              <div>
                <h3 className="font-sans text-xs uppercase tracking-[0.2em] text-[#8b8680] mb-4">
                  Tools
                </h3>
                <ul className="font-sans text-base space-y-2">
                  <li>Git</li>
                  <li>Figma</li>
                  <li>Docker</li>
                  <li>Payload CMS</li>
                </ul>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.1} className="mt-12 pt-8 border-t border-[#e8e4db]">
            <p className="font-sans text-sm text-[#8b8680]">
              Currently exploring: <span className="text-[#5a5a5a]">Go, Rust, WebAssembly</span>
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Lab Section */}
      <section className="py-24 lg:py-32 px-6 lg:px-12 bg-[#f0ece3]">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal className="flex items-baseline justify-between mb-12">
            <h2 className="font-serif text-4xl lg:text-5xl tracking-tight">Lab</h2>
            <span className="font-sans text-xs uppercase tracking-[0.2em] text-[#8b8680]">
              Experiments & Learning
            </span>
          </ScrollReveal>

          <StaggerContainer
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            staggerDelay={0.1}
          >
            {[
              {
                name: 'Rust CLI Tool',
                desc: 'File processing utility built to learn Rust',
                tech: 'Rust',
              },
              {
                name: 'Go API Server',
                desc: 'REST API with middleware and auth',
                tech: 'Go, PostgreSQL',
              },
              {
                name: 'Weather Dashboard',
                desc: 'Real-time data visualization',
                tech: 'React, D3.js',
              },
              {
                name: 'Portfolio v1',
                desc: 'Previous iteration of this site',
                tech: 'Next.js, MDX',
              },
              {
                name: 'Task Tracker',
                desc: 'Local-first productivity app',
                tech: 'Svelte, SQLite',
              },
              {
                name: 'Color Palette Gen',
                desc: 'Algorithmic color scheme generator',
                tech: 'TypeScript, Canvas',
              },
            ].map((item) => (
              <StaggerItem key={item.name}>
                <a
                  href="#"
                  className="group block p-6 bg-[#f8f6f1] hover:bg-white transition-colors"
                >
                  <h3 className="font-serif text-lg mb-2 group-hover:translate-x-1 transition-transform">
                    {item.name}
                  </h3>
                  <p className="font-sans text-sm text-[#5a5a5a] mb-3">{item.desc}</p>
                  <span className="font-sans text-xs text-[#8b8680]">{item.tech}</span>
                </a>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Contact / Footer */}
      <footer className="py-24 lg:py-32 px-6 lg:px-12 bg-[#1a1a1a] text-[#f8f6f1]">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-16">
              <div>
                <h2 className="font-serif text-4xl lg:text-6xl tracking-tight mb-6">
                  Let&apos;s work together
                </h2>
                <p className="font-sans text-lg text-[#b8b4ab] max-w-md">
                  I&apos;m currently available for full-time engineering roles. Based in NYC, open
                  to remote opportunities.
                </p>
              </div>
              <div className="lg:text-right lg:flex lg:flex-col lg:justify-end">
                <MagneticButton
                  href="mailto:hello@hugohsi.dev"
                  className="inline-flex items-center gap-3 font-sans text-xl lg:text-2xl text-[#f8f6f1] hover:text-[#c4a35a] transition-colors mb-4"
                >
                  <Envelope size={24} />
                  hello@hugohsi.dev
                </MagneticButton>
                <div className="flex gap-6 lg:justify-end">
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-sans text-sm text-[#8b8680] hover:text-[#f8f6f1] transition-colors"
                  >
                    <AnimatedUnderline>GitHub</AnimatedUnderline>
                  </a>
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-sans text-sm text-[#8b8680] hover:text-[#f8f6f1] transition-colors"
                  >
                    <AnimatedUnderline>LinkedIn</AnimatedUnderline>
                  </a>
                </div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className="pt-8 border-t border-[#333] flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="font-sans text-xs text-[#8b8680]">
                © {new Date().getFullYear()} Hugo Hsi. All rights reserved.
              </p>
              <p className="font-sans text-xs text-[#8b8680]">
                Built with Next.js, TypeScript, and attention to detail.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </footer>
    </div>
  )
}
