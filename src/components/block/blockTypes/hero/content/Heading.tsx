'use client'
import { motion } from 'framer-motion'

export default function Heading() {
  return (
    <motion.h1 className="text-zinc-500 text-2xl font-medium" layoutId="heading" layout="position">
      Hi, my name is Hugo
    </motion.h1>
  )
}
