'use client'

import { UseChatHelpers } from '@ai-sdk/react'
import {
  IconCheck as Check,
  IconSearch as SearchIcon
} from '@tabler/icons-react'

import { toPublicErrorPayload } from '@/lib/errors/public-error'
import type { SearchResults as TypeSearchResults } from '@/lib/types'
import type { ToolPart, UIDataTypes, UIMessage, UITools } from '@/lib/types/ai'
import { cn } from '@/lib/utils'

import { useArtifact } from '@/components/artifact/artifact-context'

import { StatusIndicator } from './ui/status-indicator'
import { CollapsibleMessage } from './collapsible-message'
import { SearchSkeleton } from './default-skeleton'
import ProcessHeader from './process-header'
import { SearchResults } from './search-results'
import { SearchResultsImageSection } from './search-results-image'
import { Section } from './section'
import { SourceFavicons } from './source-favicons'
import {
  createVideoSearchResults,
  VideoSearchResults
} from './video-search-results'

interface SearchSectionProps {
  tool: ToolPart<'search'>
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  status?: UseChatHelpers<UIMessage<unknown, UIDataTypes, UITools>>['status']
  borderless?: boolean
  isFirst?: boolean
  isLast?: boolean
}

export function SearchSection({
  tool,
  isOpen,
  onOpenChange,
  status,
  borderless,
  isFirst = false,
  isLast = false
}: SearchSectionProps) {
  const isLoading = status === 'submitted' || status === 'streaming'

  const isToolLoading =
    tool.state === 'input-streaming' || tool.state === 'input-available'

  // Handle streaming output states
  const output = tool.state === 'output-available' ? tool.output : undefined
  const isSearching = output?.state === 'searching'
  const searchResults: TypeSearchResults | undefined =
    output?.state === 'complete' ? output : undefined

  const isError = tool.state === 'output-error'
  const errorMessage = toPublicErrorPayload(tool.errorText, {
    fallbackMessage: 'Search failed'
  }).error
  const query = tool.input?.query || output?.query || ''
  const includeDomains = tool.input?.include_domains
  const includeDomainsString =
    Array.isArray(includeDomains) && includeDomains.length > 0
      ? ` [${includeDomains.join(', ')}]`
      : ''

  const { open } = useArtifact()

  const totalResults =
    (searchResults?.results?.length || 0) +
    (searchResults?.videos?.length || 0) +
    (searchResults?.images?.length || 0)

  const header = (
    <ProcessHeader
      onInspect={() => open(tool)}
      isLoading={isLoading && (isToolLoading || isSearching)}
      ariaExpanded={isOpen}
      label={
        <div className="flex min-w-0 items-center gap-2.5 overflow-hidden">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-background/70">
            <SearchIcon className="size-3.5 text-primary/75" />
          </span>
          <div className="min-w-0">
            <span className="block truncate text-[13px] font-medium leading-5 text-foreground/82">{`${query}${includeDomainsString}`}</span>
          </div>
        </div>
      }
      meta={
        searchResults && totalResults > 0 ? (
          <div className="flex items-center gap-2">
            <StatusIndicator
              icon={Check}
              iconClassName="text-primary/75"
              className="rounded-full border border-border/45 bg-background/65 px-2 py-0.5 text-[11px]"
            >
              {totalResults} results
            </StatusIndicator>
            {searchResults.results && searchResults.results.length > 0 && (
              <SourceFavicons results={searchResults.results} maxDisplay={3} />
            )}
          </div>
        ) : undefined
      }
    />
  )

  return (
    <div className="relative">
      {/* Rails for header - show based on position */}
      {borderless && (
        <>
          {!isFirst && (
            <div className="absolute left-[18px] top-0 h-2 w-px bg-border/45" />
          )}
          {!isLast && (
            <div className="absolute bottom-0 left-[18px] h-2 w-px bg-border/45" />
          )}
        </>
      )}
      <CollapsibleMessage
        role="assistant"
        isCollapsible={true}
        header={header}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        showIcon={false}
        showBorder={!borderless}
        variant={borderless ? 'process-sub' : 'default'}
        showSeparator={false}
        chevronSize="sm"
        headerClickBehavior="split"
      >
        <div className="flex">
          {/* Rail space - always reserved when grouped */}
          {borderless && (
            <>
              <div className="flex w-[14px] shrink-0 justify-center">
                <div
                  className={cn(
                    'w-px bg-border/35 transition-opacity duration-200',
                    isOpen ? 'opacity-100' : 'opacity-0'
                  )}
                  style={{
                    marginTop: isFirst ? '0' : '-1rem',
                    marginBottom: isLast ? '0' : '-1rem'
                  }}
                />
              </div>
              <div className="w-2 shrink-0" />
            </>
          )}
          <div className="flex-1">
            {searchResults &&
              searchResults.images &&
              searchResults.images.length > 0 && (
                <Section>
                  <SearchResultsImageSection
                    images={searchResults.images}
                    query={query}
                  />
                </Section>
              )}
            {searchResults &&
              searchResults.videos &&
              searchResults.videos.length > 0 && (
                <Section title="Videos">
                  <VideoSearchResults
                    results={createVideoSearchResults(searchResults, query)}
                  />
                </Section>
              )}
            {isError ? (
              <Section>
                <div className="bg-card rounded-lg">
                  <div className="flex items-center gap-2 w-full">
                    <span className="text-sm text-destructive block flex-1 min-w-0">
                      {errorMessage}
                    </span>
                  </div>
                </div>
              </Section>
            ) : (isLoading && isToolLoading) || isSearching ? (
              <SearchSkeleton />
            ) : searchResults?.results && searchResults.results.length > 0 ? (
              <Section title="Sources">
                <SearchResults results={searchResults.results} />
              </Section>
            ) : null}
          </div>
        </div>
      </CollapsibleMessage>
    </div>
  )
}
