'use client'

import { useMemo } from 'react'

import { math } from '@streamdown/math'
import {
  defaultRehypePlugins,
  Streamdown,
  type StreamdownProps
} from 'streamdown'

import { mergeStreamdownSpecRenderer } from '@/lib/render/streamdown-spec'
import type { SearchResultItem } from '@/lib/types'
import { cn } from '@/lib/utils'
import { processCitations } from '@/lib/utils/citation'

import { CitationProvider } from './citation-context'
import { Citing } from './custom-link'

import 'katex/dist/katex.min.css'

const rehypePlugins = Object.values(defaultRehypePlugins)

const customComponents = {
  a: Citing
}

export function MarkdownMessage({
  message,
  className,
  citationMaps
}: {
  message: string
  className?: string
  citationMaps?: Record<string, Record<number, SearchResultItem>>
}) {
  // Process citations to replace [number](#toolCallId) with [number](actual-url)
  const processedMessage = processCitations(message || '', citationMaps || {})

  const streamdownProps = useMemo<Partial<StreamdownProps>>(
    () => ({
      mode: 'streaming' as const,
      plugins: mergeStreamdownSpecRenderer({ math })
    }),
    []
  )

  return (
    <CitationProvider citationMaps={citationMaps}>
      <div
        className={cn(
          'prose-sm prose-neutral max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-h2:mt-7 prose-h2:mb-3 prose-h3:mt-6 prose-h3:mb-2 prose-p:leading-7 prose-p:text-foreground/90 prose-li:leading-7 prose-strong:text-foreground prose-a:text-primary prose-a:decoration-primary/30 prose-a:underline-offset-4 hover:prose-a:decoration-primary/60',
          className
        )}
      >
        <Streamdown
          {...streamdownProps}
          rehypePlugins={rehypePlugins}
          components={customComponents}
        >
          {processedMessage}
        </Streamdown>
      </div>
    </CitationProvider>
  )
}
