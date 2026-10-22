import { redirect } from 'next/navigation'
import { createPageClient } from '@/lib/supabase/server'

/** Returns { supabase, user, profile } or redirects to /login. */
export async function requireUser(nextPath = '/dashboard') {
  const supabase = await createPageClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`)

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, created_at')
    .eq('id', user.id)
    .single()
  if (!profile) redirect('/login')

  return { supabase, user, profile }
}

/** Admin only — everyone else is sent to their own area. */
export async function requireAdmin(nextPath = '/admin') {
  const ctx = await requireUser(nextPath)
  if (ctx.profile.role !== 'admin') redirect('/dashboard')
  return ctx
}
