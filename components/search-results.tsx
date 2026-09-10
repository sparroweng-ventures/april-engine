'use client'

import { useState } from 'react'
import Link from 'next/link'

import { SearchResultItem } from '@/lib/types'
import { displayUrlName } from '@/lib/utils/domain'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export interface SearchResultsProps {
  results: SearchResultItem[]
  displayMode?: 'grid' | 'list'
}

export function SearchResults({
  results,
  displayMode = 'grid'
}: SearchResultsProps) {
  // State to manage whether to display the results
  const [showAllResults, setShowAllResults] = useState(false)

  const handleViewMore = () => {
    setShowAllResults(true)
  }

  // Logic for grid mode
  const displayedGridResults = showAllResults ? results : results.slice(0, 3)
  const additionalResultsCount = results.length > 3 ? results.length - 3 : 0

  // --- List Mode Rendering ---
  if (displayMode === 'list') {
    return (
      <div className="flex flex-col gap-2">
        {results.map((result, index) => (
          <Link
            href={result.url}
            key={index}
            passHref
            target="_blank"
            className="block"
          >
            <Card className="w-full rounded-xl border-border/60 bg-card/60 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:bg-card hover:shadow-md">
              <CardContent className="flex items-start gap-3 p-3">
                <Avatar className="mt-0.5 h-7 w-7 shrink-0 rounded-lg">
                  <AvatarImage
                    src={`https://www.google.com/s2/favicons?domain=${
                      new URL(result.url).hostname
                    }`}
                    alt={new URL(result.url).hostname}
                  />
                  <AvatarFallback className="text-xs">
                    {new URL(result.url).hostname[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="grow overflow-hidden space-y-0.5">
                  <p className="text-sm font-semibold leading-5 line-clamp-1">
                    {result.title || new URL(result.url).pathname}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {result.content}
                  </p>
                  <div className="mt-1.5 text-[11px] text-muted-foreground/70 truncate">
                    <span className="underline">
                      {new URL(result.url).hostname}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    )
  }

  // --- Grid Mode Rendering (Existing Logic) ---
  return (
    <div className="flex flex-col gap-2 md:-m-1 md:flex-row md:flex-wrap md:gap-0">
      {displayedGridResults.map((result, index) => (
        <div className="min-w-0 md:w-1/3 md:p-1" key={index}>
          <Link href={result.url} passHref target="_blank">
            <Card className="h-full flex-1 rounded-xl border-border/60 bg-card/60 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:bg-card hover:shadow-md">
              <CardContent className="flex h-full min-w-0 items-center justify-between gap-3 p-3 md:flex-col md:items-stretch">
                <p className="min-w-0 flex-1 line-clamp-2 text-[13px] font-medium leading-5 md:min-h-10">
                  {result.title || result.content}
                </p>
                <div className="flex max-w-[42%] shrink-0 items-center space-x-1 min-w-0 md:mt-2 md:max-w-full md:shrink">
                  <Avatar className="h-5 w-5 shrink-0 rounded-md">
                    <AvatarImage
                      src={`https://www.google.com/s2/favicons?domain=${
                        new URL(result.url).hostname
                      }`}
                      alt={new URL(result.url).hostname}
                    />
                    <AvatarFallback>
                      {new URL(result.url).hostname[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 truncate text-[11px] font-medium text-muted-foreground/70">
                    {displayUrlName(result.url)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      ))}
      {!showAllResults && additionalResultsCount > 0 && (
        <>
          <div className="flex justify-center py-1 md:hidden">
            <Button
              variant="link"
              className="h-auto px-2 py-1 text-muted-foreground"
              onClick={handleViewMore}
            >
              View {additionalResultsCount} more
            </Button>
          </div>
          <div className="hidden md:block md:w-1/3 md:p-1">
            <Card className="flex h-full flex-1 items-center justify-center">
              <CardContent className="p-2">
                <Button
                  variant="link"
                  className="text-muted-foreground"
                  onClick={handleViewMore}
                >
                  View {additionalResultsCount} more
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
