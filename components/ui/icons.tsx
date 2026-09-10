'use client'

import { useId } from 'react'

import { cn } from '@/lib/utils'

function AprilEngineMark({
  className,
  ...props
}: React.ComponentProps<'svg'>) {
  const gradientId = `april-engine-green-${useId().replace(/:/g, '')}`

  return (
    <svg
      viewBox="0 0 200 200"
      role="img"
      aria-label="April Engine"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('size-4', className)}
      {...props}
    >
      <defs>
        <linearGradient id={gradientId} x1="10%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stopColor="#A5C51A" />
          <stop offset="100%" stopColor="#849E16" />
        </linearGradient>
      </defs>
      <g transform="translate(100,110)" fill={`url(#${gradientId})`}>
        <path d="M0,0 C -6,-26 6,-52 26,-64 C 40,-54 38,-28 18,-10 C 12,-4 5,-1 0,0 Z" />
        <path
          d="M0,0 C -6,-26 6,-52 26,-64 C 40,-54 38,-28 18,-10 C 12,-4 5,-1 0,0 Z"
          transform="rotate(60)"
        />
        <path
          d="M0,0 C -6,-26 6,-52 26,-64 C 40,-54 38,-28 18,-10 C 12,-4 5,-1 0,0 Z"
          transform="rotate(120)"
        />
        <path
          d="M0,0 C -6,-26 6,-52 26,-64 C 40,-54 38,-28 18,-10 C 12,-4 5,-1 0,0 Z"
          transform="rotate(180)"
        />
        <path
          d="M0,0 C -6,-26 6,-52 26,-64 C 40,-54 38,-28 18,-10 C 12,-4 5,-1 0,0 Z"
          transform="rotate(240)"
        />
        <path
          d="M0,0 C -6,-26 6,-52 26,-64 C 40,-54 38,-28 18,-10 C 12,-4 5,-1 0,0 Z"
          transform="rotate(300)"
        />
        <circle cx="0" cy="0" r="7" fill="#7C8F14" />
      </g>
    </svg>
  )
}

function IconLogo({ className, ...props }: React.ComponentProps<'svg'>) {
  return <AprilEngineMark className={className} {...props} />
}

function IconLogoOutline({
  className,
  ...props
}: React.ComponentProps<'svg'>) {
  return <AprilEngineMark className={className} {...props} />
}

function IconBlinkingLogo({
  className,
  ...props
}: React.ComponentProps<'svg'>) {
  return <AprilEngineMark className={className} {...props} />
}

export { IconBlinkingLogo, IconLogo, IconLogoOutline }
