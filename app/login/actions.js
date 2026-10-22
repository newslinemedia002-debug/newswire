'use server'

import { redirect } from 'next/navigation'
import { createPageClient } from '@/lib/supabase/server'

function safeNext(next) {
  return typeof next === 'string' && next.startsWith('/') && !next.startsWith('//')
    ? next
    : '/dashboard'
}

export async function signIn(prevState, formData) {
  const email = String(formData.get('email') || '').trim()
  const password = String(formData.get('password') || '')
  const next = safeNext(formData.get('next'))

  if (!email || !password) {
    return { error: 'Enter your email and password.' }
  }

  const supabase = await createPageClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    return {
      error:
        error.message === 'Email not confirmed'
          ? 'Your account email is not confirmed. Ask an administrator to resend confirmation.'
          : 'Invalid email or password.',
    }
  }
  redirect(next)
}
