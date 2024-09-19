import ProjectBlock from '@/components/blocks/blockTypes/project/projectBlock.tsx/ProjectBlock'
import { payload } from '@/lib/getPayload'

export default async function Projects() {
  const { docs } = await payload.find({
    collection: 'projects',
  })
  console.log(docs)
  return (
    <>
      {docs.map((doc) => (
        <ProjectBlock key={doc.id} {...doc} />
      ))}
    </>
  )
}
