'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import type { User } from '@supabase/supabase-js'
import {
  IconChevronUp as ChevronUp,
  IconLink as Link2,
  IconLogout as LogOut,
  IconUserCircle as UserRound
} from '@tabler/icons-react'

import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

import { AccountSettingsDialog } from '@/components/account-settings-dialog'

import { Button } from './ui/button'
import { ExternalLinkItems } from './external-link-items'

interface UserMenuProps {
  user: User
  variant?: 'icon' | 'sidebar'
}

export default function UserMenu({ user, variant = 'icon' }: UserMenuProps) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const userName =
    user.user_metadata?.full_name || user.user_metadata?.name || 'User'
  const avatarUrl =
    user.user_metadata?.avatar_url || user.user_metadata?.picture

  const getInitials = (name: string, email: string | undefined) => {
    if (name && name !== 'User') {
      const names = name.split(' ')
      if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      }
      return name.substring(0, 2).toUpperCase()
    }
    if (email) {
      return email.split('@')[0].substring(0, 2).toUpperCase()
    }
    return 'U'
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const handleOpenAccount = () => {
    setMenuOpen(false)
    window.setTimeout(() => setAccountOpen(true), 0)
  }

  const avatar = (
    <Avatar className={cn(variant === 'sidebar' ? 'size-9' : 'size-6')}>
      <AvatarImage src={avatarUrl} alt={userName} />
      <AvatarFallback className="text-[11px] font-semibold">
        {getInitials(userName, user.email)}
      </AvatarFallback>
    </Avatar>
  )

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen} modal={false}>
        <DropdownMenuTrigger asChild>
          {variant === 'sidebar' ? (
            <button
              type="button"
              className="flex w-full items-center gap-2.5 rounded-xl border border-sidebar-border/60 bg-sidebar-accent/25 p-2 text-left shadow-sm transition-colors hover:bg-sidebar-accent/50"
            >
              {avatar}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold text-sidebar-foreground">
                  {userName}
                </span>
                <span className="mt-0.5 block truncate text-[10px] text-sidebar-foreground/45">
                  {user.email}
                </span>
              </span>
              <ChevronUp className="size-4 shrink-0 text-sidebar-foreground/40" />
            </button>
          ) : (
            <Button
              variant="ghost"
              className="relative size-8 rounded-full p-0"
              aria-label="Open account menu"
            >
              {avatar}
            </Button>
          )}
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="w-64 rounded-xl border-border/70 p-1.5 shadow-xl"
          align={variant === 'sidebar' ? 'start' : 'end'}
          side={variant === 'sidebar' ? 'top' : 'bottom'}
          sideOffset={8}
          forceMount
        >
          <DropdownMenuLabel className="px-2.5 py-2 font-normal">
            <div className="flex items-center gap-2.5">
              <Avatar className="size-9">
                <AvatarImage src={avatarUrl} alt={userName} />
                <AvatarFallback className="text-[11px] font-semibold">
                  {getInitials(userName, user.email)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium leading-none">
                  {userName}
                </p>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="rounded-lg"
            onSelect={event => {
              event.preventDefault()
              handleOpenAccount()
            }}
          >
            <UserRound className="size-4" />
            <span>Account & settings</span>
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="rounded-lg">
              <Link2 className="size-4" />
              <span>Links</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <ExternalLinkItems />
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="rounded-lg text-destructive focus:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="size-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AccountSettingsDialog
        open={accountOpen}
        onOpenChange={setAccountOpen}
        user={user}
      />
    </>
  )
}
