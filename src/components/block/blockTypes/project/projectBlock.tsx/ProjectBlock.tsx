import Block from '@/components/block/Block'
import Default from '@/components/block/blockTypes/project/projectBlock.tsx/Default'
import Expanded from '@/components/block/blockTypes/project/projectBlock.tsx/Expanded'
import { Project } from '@/payload-types'

type ProjectBlockProps = Project

export default function ProjectBlock(props: ProjectBlockProps) {
  return (
    <Block
      id={props.id.toString()}
      cols={2}
      rows={2}
      className="p-0 overflow-hidden"
      defaultComponent={<Default {...props} />}
      expandedComponent={<Expanded />}
    />
  )
}
