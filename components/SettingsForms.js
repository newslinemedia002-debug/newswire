'use client'

import { useActionState } from 'react'
import { changePassword, changeDisplayName } from '@/app/dashboard/actions'

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, null)
  return (
    <form action={action}>
      {state?.error && (
        <div className="alert alertError" role="alert">{state.error}</div>
      )}
      {state?.success && (
        <div className="alert alertSuccess" role="status">{state.success}</div>
      )}
      <label className="field">
        <span>New password</span>
        <input className="input" type="password" name="password" autoComplete="new-password" required minLength={6} />
      </label>
      <label className="field">
        <span>Confirm new password</span>
        <input className="input" type="password" name="confirm" autoComplete="new-password" required minLength={6} />
      </label>
      <button className="btn" type="submit" disabled={pending}>
        {pending ? 'Updating…' : 'Change password'}
      </button>
    </form>
  )
}

export function NameForm({ initialName }) {
  const [state, action, pending] = useActionState(changeDisplayName, null)
  return (
    <form action={action}>
      {state?.error && (
        <div className="alert alertError" role="alert">{state.error}</div>
      )}
      {state?.success && (
        <div className="alert alertSuccess" role="status">{state.success}</div>
      )}
      <label className="field">
        <span>Display name</span>
        <input
          className="input"
          type="text"
          name="full_name"
          defaultValue={initialName || ''}
          required
          maxLength={80}
        />
      </label>
      <button className="btn" type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Save name'}
      </button>
    </form>
  )
}
