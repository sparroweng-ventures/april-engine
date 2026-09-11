'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/index'

import { Button } from '@/components/ui/button'
import { IconLogo } from '@/components/ui/icons'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      })
      if (error) throw error
      router.push('/auth/sign-up-success')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('w-full', className)} {...props}>
      <div className="mb-10 flex items-center gap-2.5">
        <IconLogo className="size-7" />
        <span className="text-[15px] font-semibold tracking-[-0.02em]">
          April Engine
        </span>
      </div>

      <div className="mb-8">
        <h1 className="text-4xl font-semibold tracking-[-0.045em] text-foreground sm:text-[42px]">
          Create an account
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Start researching, comparing sources, and saving your work.
        </p>
      </div>

      <form onSubmit={handleSignUp} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            autoComplete="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="h-11 rounded-xl bg-background/70 px-4"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">
            Password
          </Label>
          <PasswordInput
            id="password"
            type="password"
            placeholder="Create a password"
            autoComplete="new-password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="h-11 rounded-xl bg-background/70 px-4 pr-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="repeat-password" className="text-sm font-medium">
            Confirm password
          </Label>
          <PasswordInput
            id="repeat-password"
            type="password"
            placeholder="Repeat your password"
            autoComplete="new-password"
            required
            value={repeatPassword}
            onChange={e => setRepeatPassword(e.target.value)}
            className="h-11 rounded-xl bg-background/70 px-4 pr-11"
          />
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-destructive/20 bg-destructive/5 px-3.5 py-3 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="h-11 w-full rounded-xl text-sm font-medium"
          disabled={isLoading}
        >
          {isLoading ? 'Creating account...' : 'Continue'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          href="/auth/login"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>

      <div className="mt-10 text-center text-xs text-muted-foreground">
        <Link href="/" className="underline-offset-4 hover:text-foreground hover:underline">
          ← Back to home
        </Link>
      </div>
    </div>
  )
}
