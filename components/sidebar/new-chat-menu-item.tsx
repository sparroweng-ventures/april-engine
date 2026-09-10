'use client'

import { useRouter } from 'next/navigation'

import { IconPlus as Plus } from '@tabler/icons-react'

import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'
import { SHORTCUT_EVENTS } from '@/lib/keyboard-shortcuts'

export function NewChatMenuItem() {
  const router = useRouter()

  const handleNewChat = () => {
    const event = new CustomEvent(SHORTCUT_EVENTS.newChat, {
      cancelable: true
    })

    // ChatPanel listens for this event and performs the full reset:
    // messages, chat ID, input state, attachments, notes, etc.
    const wasHandled = !window.dispatchEvent(event)

    // Fallback for pages where ChatPanel is not mounted.
    if (!wasHandled) {
      router.push('/')
    }
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <button
          type="button"
          onClick={handleNewChat}
          className="flex w-full items-center gap-2"
        >
          <Plus className="size-4" />
          <span>New</span>
        </button>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
