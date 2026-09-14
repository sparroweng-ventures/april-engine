import { type NextRequest, NextResponse } from 'next/server'

import { createServerClient } from '@supabase/ssr'

import { getSupabasePublishableKey } from '@/lib/supabase/keys'

function createRedirectResponse(request: NextRequest, next: string) {
  const { origin } = request.nextUrl
  const forwardedHost = request.headers.get('x-forwarded-host')
  const isLocalEnv = process.env.NODE_ENV === 'development'

  const safeNext = next.startsWith('/') ? next : '/'

  const destination = isLocalEnv
    ? `${origin}${safeNext}`
    : forwardedHost
      ? `https://${forwardedHost}${safeNext}`
      : `${origin}${safeNext}`

  const response = NextResponse.redirect(destination)
  response.headers.set('Cache-Control', 'private, no-store')
  return response
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const next = request.nextUrl.searchParams.get('next') ?? '/'

  if (code) {
    const response = createRedirectResponse(request, next)
    const supabaseKey = getSupabasePublishableKey()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value)
              response.cookies.set(name, value, options)
            })
          }
        }
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return response
    }
  }

  const errorResponse = NextResponse.redirect(
    new URL('/auth/error', request.nextUrl.origin)
  )
  errorResponse.headers.set('Cache-Control', 'private, no-store')
  return errorResponse
}
