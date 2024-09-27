import { SlotProps } from '@radix-ui/react-slot'
import { ComponentProps, JSX, JSXElementConstructor } from 'react'

type Default<T extends keyof JSX.IntrinsicElements | JSXElementConstructor<any>> = {
  asChild?: false
} & ComponentProps<T>

type AsChild = { asChild: true } & SlotProps

export type AsChildProps<T extends keyof JSX.IntrinsicElements | JSXElementConstructor<any>> =
  | Default<T>
  | AsChild
