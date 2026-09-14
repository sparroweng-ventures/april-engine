'use client'

import Link from 'next/link'

import {
  IconLink as Link2,
  IconLogin as LogIn,
  IconPalette as Palette,
  IconSettings as Settings2,
  IconUserPlus as UserPlus
} from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

import { ExternalLinkItems } from './external-link-items'
import { ThemeMenuItems } from './theme-menu-items'

export default function GuestMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-full text-muted-foreground transition-colors hover:bg-card/80 hover:text-foreground data-[state=open]:bg-card/80 data-[state=open]:text-foreground"
        >
          <Settings2 className="size-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-[17.5rem] rounded-2xl border-border/60 bg-popover/95 p-2 shadow-xl shadow-black/5 backdrop-blur-xl"
        align="end"
        sideOffset={8}
        forceMount
      >
        <div className="px-2.5 pb-2 pt-2">
          <p className="text-sm font-medium text-foreground">
            Welcome to April Engine
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Create an account to save your chats and continue anywhere.
          </p>
        </div>

        <div className="grid gap-1.5 px-1 pb-2">
          <Button asChild size="sm" className="w-full rounded-xl">
            <Link href="/auth/sign-up">
              <UserPlus className="size-4" />
              Create account
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="w-full rounded-xl text-muted-foreground hover:text-foreground"
          >
            <Link href="/auth/login">
              <LogIn className="size-4" />
              Sign in
            </Link>
          </Button>
        </div>

        <DropdownMenuSeparator className="mx-1 my-1 bg-border/60" />

        <div className="p-1">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="rounded-xl px-2.5 py-2.5">
              <Palette className="size-4" />
              <span>Appearance</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="min-w-40 rounded-xl border-border/60 p-1.5 shadow-lg">
              <ThemeMenuItems />
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="rounded-xl px-2.5 py-2.5">
              <Link2 className="size-4" />
              <span>Links</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="min-w-40 rounded-xl border-border/60 p-1.5 shadow-lg">
              <ExternalLinkItems />
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
