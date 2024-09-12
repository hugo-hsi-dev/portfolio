import { motion } from 'framer-motion'
import { MoveVertical } from 'lucide-react'
import { Dispatch, SetStateAction } from 'react'

type SideNavItemsProps = {
  value: string
  hoveredItem?: string
  setHoveredItem: Dispatch<SetStateAction<string | undefined>>
  isDragging: boolean
  setIsDragging: Dispatch<SetStateAction<boolean>>
}

function renderIcon(value: string, hoveredItem?: string) {
  if (!hoveredItem) {
    return <MoveVertical className="invisible" />
  }

  if (value === hoveredItem) {
    return (
      <motion.div layoutId="move-vertical">
        <MoveVertical />
      </motion.div>
    )
  }
  return <MoveVertical className="invisible" />
}

function handleMouseEnter(
  value: string,
  isDragging: boolean,
  setState: Dispatch<SetStateAction<string | undefined>>,
) {
  if (isDragging) {
    return
  }
  setState(value)
}

function handleMouseLeave(
  isDragging: boolean,
  setState: Dispatch<SetStateAction<string | undefined>>,
) {
  if (isDragging) {
    return
  }
  setState(undefined)
}

export default function SideNavItem({
  value,
  hoveredItem,
  setHoveredItem,
  isDragging,
  setIsDragging,
}: SideNavItemsProps) {
  return (
    <div
      className="flex"
      onMouseEnter={() => handleMouseEnter(value, isDragging, setHoveredItem)}
      onMouseLeave={() => handleMouseLeave(isDragging, setHoveredItem)}
      onMouseDown={() => setIsDragging(true)}
      onMouseUp={() => setIsDragging(false)}
    >
      {renderIcon(value, hoveredItem)}
      {value}
    </div>
  )
}
