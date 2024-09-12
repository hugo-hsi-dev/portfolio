'use client'

import SideNavItem from '@/components/sideNav/SideNavItem'
import { motion, Reorder } from 'framer-motion'
import { MoveVertical } from 'lucide-react'
import { useState } from 'react'
const defaultConfig = ['Hero', 'Projects', 'Skills', 'Contact']

export default function SideNav() {
  const [navItems, setNavItems] = useState(defaultConfig)
  const [hoveredItem, setHoveredItem] = useState<undefined | string>()
  const [isDragging, setIsDragging] = useState(false)

  return (
    <Reorder.Group axis="y" values={navItems} onReorder={setNavItems}>
      <div className="flex relative">
        {!hoveredItem && (
          <motion.div layoutId="move-vertical" className="absolute top-1/2 -translate-y-2/4">
            <MoveVertical />
          </motion.div>
        )}
        <div className="flex flex-col">
          <div>
            {navItems.map((item, index) => (
              <Reorder.Item key={item} value={item}>
                <SideNavItem
                  value={item}
                  hoveredItem={hoveredItem}
                  setHoveredItem={setHoveredItem}
                  isDragging={isDragging}
                  setIsDragging={setIsDragging}
                />
              </Reorder.Item>
            ))}
          </div>
        </div>
      </div>
    </Reorder.Group>
  )
}
