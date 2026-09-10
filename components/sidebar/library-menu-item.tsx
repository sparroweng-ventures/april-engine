'use client'

import { IconLibrary } from '@tabler/icons-react'

import { captureClient } from '@/lib/analytics/posthog-client'

import { useLibrary } from '@/components/library/library-context'
import {
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar'

export function LibraryMenuItem() {
  const { isOpen, toggleLibrary } = useLibrary()

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        type="button"
        className="h-10 rounded-xl px-3 text-[13px] font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
        onClick={() => {
          toggleLibrary()
          captureClient(isOpen ? 'library_closed' : 'library_opened', {
            source: 'sidebar'
          })
        }}
      >
        <span className="flex size-6 items-center justify-center rounded-lg bg-sidebar-accent/75">
          <IconLibrary className="size-4" />
        </span>
        <span>Library</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
