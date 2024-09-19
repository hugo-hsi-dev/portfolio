'use client'

import { motion } from 'framer-motion'

type AboutMeProps = {
  aboutMe: string
}

export default function AboutMe({ aboutMe }: AboutMeProps) {
  return (
    <motion.p
      className="text-white text-lg md:text-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      layout="preserve-aspect"
    >
      {aboutMe}
    </motion.p>
  )
}
