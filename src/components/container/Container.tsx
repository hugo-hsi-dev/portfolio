import { PropsWithChildren } from 'react'

type ContainerProps = PropsWithChildren

export default function Container({ children }: ContainerProps) {
  return (
    <div className="mx-auto sm:max-w-[480px] md:max-w-[640px] lg:max-w-[768px] xl:max-w-[1024px] 2xl:max-w-[1280px]">
      <div className="mx-6">{children}</div>
    </div>
  )
}
