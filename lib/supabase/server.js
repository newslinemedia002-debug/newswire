import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/** Cookie-aware client for the current request (respects RLS via the visitor's session). */
export async function createPageClient() {
  const cookieStore = await cookies()
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Called from a Server Component: refresh cookies are persisted by the
          // proxy instead, which runs before every request.
        }
      },
    },
  })
}

/** Service-role client. Server-only, bypasses RLS — use exclusively after an authz check. */
export function createAdminClient() {
  return createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

let publicClient = null

/**
 * Cookie-less anon client for public pages (home, sections, articles, sitemap).
 * Never touches request APIs, so pages using it stay ISR-cacheable; RLS limits
 * reads to published rows. Auth-dependent UI lives in client components.
 */
export function createPublicClient() {
  if (!publicClient) {
    publicClient = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return publicClient
}
