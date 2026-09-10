'use client'

import { useCallback, useState, useTransition } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

import {
  IconDots as MoreHorizontal,
  IconTrash as Trash2
} from '@tabler/icons-react'
import { toast } from 'sonner'

import { deleteChat } from '@/lib/actions/chat'
import { Chat as DBChat } from '@/lib/db/schema'
import { SHORTCUT_EVENTS } from '@/lib/keyboard-shortcuts'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar'

import { Spinner } from '../ui/spinner'

interface ChatMenuItemProps {
  chat: DBChat
}

const formatDateWithTime = (date: Date | string) => {
  const parsedDate = new Date(date)
  const now = new Date()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  const formatTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  if (
    parsedDate.getDate() === now.getDate() &&
    parsedDate.getMonth() === now.getMonth() &&
    parsedDate.getFullYear() === now.getFullYear()
  ) {
    return `Today, ${formatTime(parsedDate)}`
  } else if (
    parsedDate.getDate() === yesterday.getDate() &&
    parsedDate.getMonth() === yesterday.getMonth() &&
    parsedDate.getFullYear() === yesterday.getFullYear()
  ) {
    return `Yesterday, ${formatTime(parsedDate)}`
  } else {
    return parsedDate.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }
}

export function ChatMenuItem({ chat }: ChatMenuItemProps) {
  const pathname = usePathname()
  const path = `/search/${chat.id}`
  const isActive = pathname === path
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAlertOpen, setIsAlertOpen] = useState(false)

  const handleDeleteChat = useCallback(() => {
    // Close overlays first so focus and pointer locks are released
    // before the list updates and this item potentially unmounts.
    setIsAlertOpen(false)
    setIsMenuOpen(false)

    startTransition(async () => {
      const result = await deleteChat(chat.id)

      if (result?.success) {
        toast.success('Chat deleted')
        if (isActive) {
          const resetEvent = new CustomEvent(SHORTCUT_EVENTS.newChat, {
            cancelable: true
          })

          // Reset the currently visible Chat instance before leaving the
          // deleted route. This prevents Next.js component caching from
          // leaving the deleted chat's messages on screen.
          const wasHandled = !window.dispatchEvent(resetEvent)

          // Fallback for pages where ChatPanel is not mounted.
          if (!wasHandled) {
            router.push('/')
          }
        }
        window.dispatchEvent(new CustomEvent('chat-history-updated'))
      } else if (result?.error) {
        toast.error(result.error)
      } else {
        toast.error('An unexpected error occurred while deleting the chat.')
      }
    })
  }, [chat.id, isActive, router, startTransition])
  const handleMenuOpenChange = useCallback((open: boolean) => {
    setIsMenuOpen(open)
  }, [])

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        className="group h-auto min-h-12 flex-col items-start gap-1 rounded-xl border border-transparent px-2.5 py-2 pr-9 transition-all hover:border-sidebar-border/55 hover:bg-sidebar-accent/45 data-[active=true]:border-primary/15 data-[active=true]:bg-primary/10 data-[active=true]:shadow-sm"
      >
        <Link href={path}>
          <div className="w-full truncate select-none text-xs font-medium leading-4 text-sidebar-foreground/90">
            {chat.title}
          </div>
          <div className="w-full truncate text-[10px] font-medium text-sidebar-foreground/40">
            {formatDateWithTime(chat.createdAt)}
          </div>
        </Link>
      </SidebarMenuButton>

      <DropdownMenu open={isMenuOpen} onOpenChange={handleMenuOpenChange}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction className="mr-1 size-7 rounded-lg p-1 text-sidebar-foreground/45 opacity-0 transition-opacity group-hover/menu-item:opacity-100 data-[state=open]:opacity-100">
            <MoreHorizontal size={16} />
            <span className="sr-only">Chat Actions</span>
          </SidebarMenuAction>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start">
          <DropdownMenuItem
            className="gap-2 text-destructive focus:text-destructive"
            onSelect={event => {
              event.preventDefault()
              setIsMenuOpen(false)
              setIsAlertOpen(true)
            }}
          >
            <Trash2 size={14} />
            Delete Chat
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this
              chat history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={event => {
                event.preventDefault()
                handleDeleteChat()
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? (
                <div className="flex items-center justify-center">
                  <Spinner />
                </div>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarMenuItem>
  )
}
