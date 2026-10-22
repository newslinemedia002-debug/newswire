'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signIn } from '@/app/login/actions'

export default function LoginForm({ next }) {
  const [state, action, pending] = useActionState(signIn, null)

  return (
    <form action={action}>
      <input type="hidden" name="next" value={next} />
      {state?.error && (
        <div className="alert alertError" role="alert">
          {state.error}
        </div>
      )}
      <label className="field">
        <span>Email address</span>
        <input
          className="input"
          type="email"
          name="email"
          autoComplete="email"
          required
          autoFocus
          placeholder="you@example.com"
        />
      </label>
      <label className="field">
        <span>Password</span>
        <input
          className="input"
          type="password"
          name="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
        />
      </label>
      <button className="btn" type="submit" disabled={pending} style={{ width: '100%' }}>
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 16, marginBottom: 0 }}>
        No account? Newswire does not have open registration — an administrator adds users.{' '}
        <Link href="/">Back to the front page</Link>
      </p>
    </form>
  )
}
