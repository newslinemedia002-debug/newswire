'use client'

import { useActionState, useState } from 'react'
import {
  createUser,
  setUserRole,
  resetUserPassword,
  deleteUser,
} from '@/app/admin/actions'
import dash from '@/app/dashboard/dashboard.module.css'

function CreateUserForm() {
  const [state, action, pending] = useActionState(createUser, null)
  return (
    <form action={action} className={dash.panelCard} style={{ marginBottom: 24 }}>
      <h2>Add a user</h2>
      <p style={{ fontSize: 14, color: 'var(--muted)', margin: '0 0 14px' }}>
        New users can sign in immediately — passwords can be reset here later.
      </p>
      {state?.error && (
        <div className="alert alertError" role="alert">{state.error}</div>
      )}
      {state?.success && (
        <div className="alert alertSuccess" role="status">{state.success}</div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <label className="field" style={{ margin: 0 }}>
          <span>Full name</span>
          <input className="input" type="text" name="full_name" required maxLength={80} placeholder="Jane Wanjiku" />
        </label>
        <label className="field" style={{ margin: 0 }}>
          <span>Email</span>
          <input className="input" type="email" name="email" required placeholder="jane@newsroom.com" />
        </label>
        <label className="field" style={{ margin: 0 }}>
          <span>Password</span>
          <input className="input" type="text" name="password" required minLength={6} placeholder="At least 6 characters" />
        </label>
        <label className="field" style={{ margin: 0 }}>
          <span>Role</span>
          <select className="select" name="role" defaultValue="author">
            <option value="author">Author</option>
            <option value="admin">Admin</option>
          </select>
        </label>
      </div>
      <button className="btn" type="submit" disabled={pending} style={{ marginTop: 14 }}>
        {pending ? 'Creating…' : 'Create user'}
      </button>
    </form>
  )
}

function UserRow({ user, isSelf }) {
  const [showReset, setShowReset] = useState(false)
  const [resetState, resetAction, resetPending] = useActionState(resetUserPassword, null)
  const role = user.role || 'author'

  return (
    <tr>
      <td style={{ minWidth: 240 }}>
        <strong>{user.full_name || '—'}</strong>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>{user.email}</div>
        {isSelf && <span className="badge badgeAdmin" style={{ marginTop: 4 }}>You</span>}
      </td>
      <td>
        <span className={`badge ${role === 'admin' ? 'badgeAdmin' : 'badgeAuthor'}`}>{role}</span>
      </td>
      <td style={{ whiteSpace: 'nowrap', color: 'var(--muted)' }}>
        {user.created_at ? new Date(user.created_at).toLocaleDateString('en-KE') : '—'}
      </td>
      <td>
        <div className={dash.rowActions}>
          <form action={setUserRole}>
            <input type="hidden" name="id" value={user.id} />
            <input type="hidden" name="role" value={role === 'admin' ? 'author' : 'admin'} />
            <button className="btn btnGhost btnSmall" type="submit">
              Make {role === 'admin' ? 'author' : 'admin'}
            </button>
          </form>

          <button
            className="btn btnGhost btnSmall"
            type="button"
            onClick={() => setShowReset((v) => !v)}
          >
            {showReset ? 'Close' : 'Reset password'}
          </button>

          {!isSelf && (
            <form
              action={deleteUser}
              onSubmit={(e) => {
                if (!confirm('Delete this user and ALL their articles? This cannot be undone.')) {
                  e.preventDefault()
                }
              }}
            >
              <input type="hidden" name="id" value={user.id} />
              <button className="btn btnDanger btnSmall" type="submit">Delete</button>
            </form>
          )}
        </div>

        {showReset && (
          <form action={resetAction} style={{ marginTop: 10 }}>
            <input type="hidden" name="id" value={user.id} />
            {resetState?.error && (
              <div className="alert alertError" role="alert" style={{ margin: '0 0 8px' }}>
                {resetState.error}
              </div>
            )}
            {resetState?.success && (
              <div className="alert alertSuccess" role="status" style={{ margin: '0 0 8px' }}>
                {resetState.success}
              </div>
            )}
            <div className={dash.inlineForm}>
              <input
                className="input"
                type="text"
                name="password"
                required
                minLength={6}
                placeholder="New password"
                autoComplete="off"
              />
              <button className="btn btnSmall" type="submit" disabled={resetPending}>
                {resetPending ? 'Saving…' : 'Set password'}
              </button>
            </div>
          </form>
        )}
      </td>
    </tr>
  )
}

export default function UsersPanel({ users, currentUserId }) {
  return (
    <>
      <CreateUserForm />

      <div className="tableWrap">
        <table className="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Added</th>
              <th style={{ textAlign: 'right' }}>Manage</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <UserRow key={u.id} user={u} isSelf={u.id === currentUserId} />
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="empty">
          <h3>No users yet</h3>
          <p>Create the first account with the form above.</p>
        </div>
      )}
    </>
  )
}
