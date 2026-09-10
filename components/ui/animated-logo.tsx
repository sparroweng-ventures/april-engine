'use client'

import { cn } from '@/lib/utils'

import { IconLogo } from './icons'

export function AnimatedLogo({
  animate = true,
  className,
  ...props
}: React.ComponentProps<'svg'> & {
  animate?: boolean
}) {
  return (
    <IconLogo
      className={cn(
        'size-8',
        animate && 'animate-pulse motion-reduce:animate-none',
        className
      )}
      {...props}
    />
  )
}
