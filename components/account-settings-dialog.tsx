'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import type { User } from '@supabase/supabase-js'
import {
  IconDeviceLaptop as Laptop,
  IconMoon as Moon,
  IconSun as Sun,
  IconTrash as Trash2
} from '@tabler/icons-react'
import { toast } from 'sonner'

import { deleteAccount } from '@/lib/actions/account'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'

import { useTheme } from '@/components/theme-provider'

interface AccountSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User
}

const themeOptions = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Laptop }
]

export function AccountSettingsDialog({
  open,
  onOpenChange,
  user
}: AccountSettingsDialogProps) {
  const router = useRouter()
  const { setTheme, theme } = useTheme()
  const [isDeleting, startDeleteTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleteConfirmations, setDeleteConfirmations] = useState([
    false,
    false,
    false
  ])
  const activeTheme = theme ?? 'system'
  const canDeleteAccount = deleteConfirmations.every(Boolean)

  const userName =
    user.user_metadata?.full_name || user.user_metadata?.name || 'User'
  const avatarUrl =
    user.user_metadata?.avatar_url || user.user_metadata?.picture
  const initials = (() => {
    if (userName && userName !== 'User') {
      const names = userName.trim().split(/\s+/)
      if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      }
      return userName.substring(0, 2).toUpperCase()
    }
    return user.email?.split('@')[0].substring(0, 2).toUpperCase() || 'U'
  })()

  const handleDeleteAccount = () => {
    startDeleteTransition(async () => {
      const result = await deleteAccount()

      if (result.success) {
        try {
          await createClient().auth.signOut()
        } catch (error) {
          console.error('Failed to clear client session:', error)
        }

        toast.success('Account deleted')
        setConfirmOpen(false)
        onOpenChange(false)
        router.push('/')
        router.refresh()
        return
      }

      toast.error(result.error ?? 'Failed to delete account')
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={nextOpen => {
        if (!isDeleting) {
          if (!nextOpen) {
            setConfirmOpen(false)
            setDeleteConfirmations([false, false, false])
          }
          onOpenChange(nextOpen)
        }
      }}
    >
      <DialogContent className="overflow-hidden p-0 sm:max-w-lg">
        <div className="border-b border-border/60 bg-muted/20 px-6 pb-5 pt-6">
          <DialogHeader className="text-left">
            <DialogTitle className="text-lg tracking-[-0.02em]">
              Account & preferences
            </DialogTitle>
            <DialogDescription>
              Manage your April Engine profile and appearance.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-border/60 bg-background/75 p-3 shadow-sm">
            <Avatar className="size-11">
              <AvatarImage src={avatarUrl} alt={userName} />
              <AvatarFallback className="text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{userName}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 px-6 py-5">
          <section className="grid gap-3">
            <div className="grid gap-1">
              <h3 className="text-sm font-semibold">Appearance</h3>
              <p className="text-xs leading-5 text-muted-foreground">
                Choose how April Engine looks on this device.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {themeOptions.map(option => {
                const Icon = option.icon
                const selected = activeTheme === option.value

                return (
                  <Button
                    key={option.value}
                    type="button"
                    variant="outline"
                    className={cn(
                      'h-20 flex-col gap-2 rounded-xl px-2 shadow-none transition-all',
                      selected &&
                        'border-primary/30 bg-primary/10 text-foreground ring-1 ring-primary/10'
                    )}
                    aria-pressed={selected}
                    onClick={() => setTheme(option.value)}
                  >
                    <span
                      className={cn(
                        'flex size-8 items-center justify-center rounded-lg bg-muted/70',
                        selected && 'bg-primary/15 text-primary'
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="text-xs font-medium">{option.label}</span>
                  </Button>
                )
              })}
            </div>
          </section>

          <Separator />

          <section className="grid gap-3 rounded-2xl border border-destructive/15 bg-destructive/[0.025] p-4">
            <div className="grid gap-1">
              <h3 className="text-sm font-semibold">Delete account</h3>
              <p className="text-xs leading-5 text-muted-foreground">
                Permanently delete your account, chat history, and uploaded
                files. This cannot be undone.
              </p>
            </div>

            <AlertDialog
              open={confirmOpen}
              onOpenChange={nextOpen => {
                if (!isDeleting) {
                  setConfirmOpen(nextOpen)
                  if (!nextOpen) {
                    setDeleteConfirmations([false, false, false])
                  }
                }
              }}
            >
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-fit gap-2 rounded-lg border-destructive/25 text-destructive hover:bg-destructive/5 hover:text-destructive"
                  disabled={isDeleting}
                >
                  <Trash2 className="size-4" />
                  Delete account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="overflow-hidden border-border/70 p-0 sm:max-w-xl">
                <div className="border-b border-border/55 bg-muted/20 px-6 pb-5 pt-6 sm:px-7">
                  <AlertDialogHeader className="text-left">
                    <div className="mb-1 flex items-start justify-between gap-5">
                      <div className="min-w-0">
                        <AlertDialogTitle className="max-w-md text-2xl font-semibold leading-tight tracking-[-0.03em]">
                          Are you sure you want to delete your account?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="mt-2 max-w-md text-sm leading-6">
                          Before continuing, please confirm that you understand
                          what permanent account deletion means.
                        </AlertDialogDescription>
                      </div>

                      <div
                        aria-hidden="true"
                        className="hidden size-16 shrink-0 items-center justify-center rounded-2xl border border-destructive/15 bg-destructive/[0.045] sm:flex"
                      >
                        <Trash2 className="size-7 text-destructive/80" />
                      </div>
                    </div>
                  </AlertDialogHeader>
                </div>

                <div className="grid gap-5 px-6 py-5 sm:px-7">
                  <div className="grid gap-2">
                    {[
                      'I understand that my account, chat history, notes, and uploaded files will be permanently deleted.',
                      'I understand that this deletion cannot be undone or recovered later.',
                      'I understand that I will be signed out immediately after my account is deleted.'
                    ].map((label, index) => (
                      <label
                        key={label}
                        className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/55 bg-muted/25 px-3.5 py-3 transition-colors hover:bg-muted/40"
                      >
                        <input
                          type="checkbox"
                          checked={deleteConfirmations[index]}
                          disabled={isDeleting}
                          onChange={event => {
                            const checked = event.target.checked
                            setDeleteConfirmations(current =>
                              current.map((value, itemIndex) =>
                                itemIndex === index ? checked : value
                              )
                            )
                          }}
                          className="mt-0.5 size-4 shrink-0 accent-primary"
                        />
                        <span className="text-xs leading-5 text-foreground/80">
                          {label}
                        </span>
                      </label>
                    ))}
                  </div>

                  <div className="border-t border-border/60 pt-5">
                    <AlertDialogFooter className="gap-2 sm:justify-end">
                      <AlertDialogCancel
                        disabled={isDeleting}
                        className="rounded-full px-5"
                      >
                        Never mind
                      </AlertDialogCancel>
                      <AlertDialogAction
                        disabled={isDeleting || !canDeleteAccount}
                        onClick={event => {
                          event.preventDefault()
                          handleDeleteAccount()
                        }}
                        className="rounded-full bg-destructive px-5 text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isDeleting ? <Spinner /> : 'Delete my account'}
                      </AlertDialogAction>
                    </AlertDialogFooter>

                    <p className="mt-3 text-right text-[11px] leading-4 text-muted-foreground">
                      The delete button is enabled only after all confirmations
                      are checked.
                    </p>
                  </div>
                </div>
              </AlertDialogContent>
            </AlertDialog>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
