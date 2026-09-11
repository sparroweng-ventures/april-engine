import { Suspense } from 'react'
import Link from 'next/link'

import type { User } from '@supabase/supabase-js'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarRail,
  SidebarTrigger
} from '@/components/ui/sidebar'

import { ChatHistorySection } from './sidebar/chat-history-section'
import { ChatHistorySkeleton } from './sidebar/chat-history-skeleton'
import { NewChatMenuItem } from './sidebar/new-chat-menu-item'
import { IconLogo } from './ui/icons'
import UserMenu from './user-menu'

interface AppSidebarProps {
  user?: User | null
}

export default function AppSidebar({ user }: AppSidebarProps) {
  return (
    <Sidebar
      side="left"
      variant="sidebar"
      collapsible="offcanvas"
      className="border-r border-sidebar-border/70"
    >
      <SidebarHeader className="flex min-h-16 flex-row items-center justify-between border-b border-sidebar-border/50 px-2">
        <Link
          href="/"
          className="group flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-xl px-2.5 transition-colors hover:bg-sidebar-accent/45"
        >
          <span className="flex size-8 shrink-0 items-center justify-center">
            <IconLogo className="size-8 -translate-y-px" />
          </span>

          <span className="whitespace-nowrap text-[15px] font-semibold leading-5 tracking-[-0.01em]">
            April Engine
          </span>
        </Link>
        <SidebarTrigger />
      </SidebarHeader>

      <SidebarContent className="flex h-full flex-col px-2.5 py-3">
        <SidebarMenu className="gap-1.5">
          <NewChatMenuItem />
        </SidebarMenu>

        <div className="my-3 h-px bg-sidebar-border/45" />

        <div className="min-h-0 flex-1 overflow-y-auto">
          <Suspense fallback={<ChatHistorySkeleton />}>
            <ChatHistorySection />
          </Suspense>
        </div>
      </SidebarContent>

      {user && (
        <SidebarFooter className="border-t border-sidebar-border/55 p-2.5">
          <UserMenu user={user} variant="sidebar" />
        </SidebarFooter>
      )}
      <SidebarRail />
    </Sidebar>
  )
}
