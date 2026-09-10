import * as dotenv from 'dotenv'
import { defineConfig } from 'drizzle-kit'

import 'dotenv/config'

// Load local environment values when neither supported database URL is set.
if (!process.env.POSTGRES_URL && !process.env.DATABASE_URL) {
  dotenv.config({ path: '.env.local' })
}

const connectionString =
  process.env.POSTGRES_URL?.trim() || process.env.DATABASE_URL?.trim()

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: connectionString!
  }
})
