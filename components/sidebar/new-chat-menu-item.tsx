'use client'

import Link from 'next/link'

import { IconPlus as Plus } from '@tabler/icons-react'

import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'

export function NewChatMenuItem() {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        className="h-11 rounded-xl bg-primary px-3 font-medium text-primary-foreground shadow-sm hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/85"
      >
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex size-6 items-center justify-center rounded-lg bg-white/12">
            <Plus className="size-4" />
          </span>
          <span>New search</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
