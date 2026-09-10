import postgres from 'postgres'

export const dynamic = 'force-dynamic'

const VARIABLE_NAMES = [
  'DATABASE_URL',
  'POSTGRES_URL',
  'POSTGRES_PRISMA_URL',
  'POSTGRES_URL_NON_POOLING'
] as const

type VariableName = (typeof VARIABLE_NAMES)[number]

function getSafeDetails(value: string) {
  try {
    const parsed = new URL(value)
    const hostname = parsed.hostname

    return {
      parseable: true,
      connectionType: hostname.includes('pooler.supabase.com')
        ? 'Supabase pooler'
        : hostname.endsWith('.supabase.co')
          ? 'Supabase direct'
          : 'Other',
      port: parsed.port || '(default)',
      database: parsed.pathname.replace(/^\//, '') || '(not specified)',
      username: decodeURIComponent(parsed.username) || '(not specified)'
    }
  } catch {
    return {
      parseable: false,
      connectionType: 'Unknown',
      port: 'Unknown',
      database: 'Unknown',
      username: 'Unknown'
    }
  }
}

async function testConnection(name: VariableName) {
  const value = process.env[name]?.trim()

  if (!value) {
    return {
      variable: name,
      configured: false,
      connection: 'NOT TESTED'
    }
  }

  const safeDetails = getSafeDetails(value)
  const sql = postgres(value, {
    ssl:
      process.env.DATABASE_SSL_DISABLED === 'true'
        ? false
        : { rejectUnauthorized: false },
    prepare: false,
    max: 1,
    connect_timeout: 8,
    idle_timeout: 1
  })

  try {
    const result = await sql<
      { current_user: string; current_database: string }[]
    >`SELECT current_user, current_database()`

    return {
      variable: name,
      configured: true,
      ...safeDetails,
      connection: 'SUCCESS',
      connectedAs: result[0]?.current_user ?? 'Unknown',
      connectedDatabase: result[0]?.current_database ?? 'Unknown'
    }
  } catch (error) {
    const databaseError = error as {
      code?: string
      message?: string
      severity?: string
    }

    return {
      variable: name,
      configured: true,
      ...safeDetails,
      connection: 'FAILED',
      errorCode: databaseError.code ?? 'Unknown',
      errorMessage: databaseError.message ?? 'Unknown database error'
    }
  } finally {
    await sql.end({ timeout: 1 }).catch(() => undefined)
  }
}

export async function GET() {
  const results = await Promise.all(VARIABLE_NAMES.map(testConnection))

  return Response.json(
    {
      message:
        'April Engine database diagnostic. Passwords, hosts, and connection strings are intentionally not returned.',
      activeRuntimeVariable: process.env.DATABASE_RESTRICTED_URL?.trim()
        ? 'DATABASE_RESTRICTED_URL'
        : process.env.DATABASE_URL?.trim()
          ? 'DATABASE_URL'
          : 'NONE',
      databaseRestrictedUrlConfigured: Boolean(
        process.env.DATABASE_RESTRICTED_URL?.trim()
      ),
      results
    },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    }
  )
}
