import TextUnderline from '@/components/animated/TextUnderline'
import BlockOpenTrigger from '@/components/blocks/BlockOpenTrigger'
import formatImageSource from '@/lib/formatImageSource'
import { Media, Project } from '@/payload-types'
import { Github, Link } from 'lucide-react'
import Image from 'next/image'

type DefaultProps = Project

export default function Default(props: DefaultProps) {
  const image = props.image as Media
  return (
    <div className="relative h-full">
      <div className="flex flex-col justify-end h-full p-20">
        <h4 className="text-xl font-medium">Project</h4>
        <h3 className="text-5xl font-bold w-fit">
          <TextUnderline>
            <BlockOpenTrigger>{props.title}</BlockOpenTrigger>
          </TextUnderline>
        </h3>
        <div className="mt-6 flex gap-6">
          <Github width={36} height={36} />
          <Link width={36} height={36} />
        </div>
      </div>
      <Image
        src={formatImageSource(image.url)}
        alt={image.alt}
        fill
        className="absolute top-0 left-0 right-0 bottom-0 -z-10"
      />
    </div>
  )
}
