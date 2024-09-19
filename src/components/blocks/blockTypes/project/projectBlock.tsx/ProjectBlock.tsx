import Block from '@/components/blocks/Block'
import Default from '@/components/blocks/blockTypes/project/projectBlock.tsx/Default'
import Expanded from '@/components/blocks/blockTypes/project/projectBlock.tsx/Expanded'
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
