import { Suspense } from 'react'
import Link from 'next/link'

import { cn } from '@/lib/utils'

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarRail,
  SidebarTrigger
} from '@/components/ui/sidebar'

import { ChatHistorySection } from './sidebar/chat-history-section'
import { ChatHistorySkeleton } from './sidebar/chat-history-skeleton'
import { LibraryMenuItem } from './sidebar/library-menu-item'
import { NewChatMenuItem } from './sidebar/new-chat-menu-item'
import { IconLogo } from './ui/icons'

export default function AppSidebar() {
  return (
    <Sidebar
      side="left"
      variant="floating"
      collapsible="offcanvas"
      className="p-2.5 pr-0"
    >
      <SidebarHeader className="flex flex-row items-center justify-between gap-2 px-2 pb-2 pt-2">
        <Link
          href="/"
          className="group flex min-w-0 items-center gap-2.5 rounded-xl px-1.5 py-1 transition-colors hover:bg-sidebar-accent/55"
        >
          <IconLogo className={cn('size-7 shrink-0')} />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold tracking-[-0.01em]">
              April Engine
            </div>
            <div className="truncate text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Research workspace
            </div>
          </div>
        </Link>

        <SidebarTrigger className="size-8 shrink-0 rounded-xl text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground" />
      </SidebarHeader>

      <SidebarContent className="flex h-full flex-col gap-3 px-2 pb-2 pt-1">
        <SidebarMenu className="gap-1.5">
          <NewChatMenuItem />
          <LibraryMenuItem />
        </SidebarMenu>

        <div className="mx-1 h-px bg-sidebar-border/70" />

        <div className="min-h-0 flex-1 overflow-hidden">
          <Suspense fallback={<ChatHistorySkeleton />}>
            <ChatHistorySection />
          </Suspense>
        </div>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  )
}
