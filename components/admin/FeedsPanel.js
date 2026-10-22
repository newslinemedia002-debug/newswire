'use client'

import { useActionState, useState } from 'react'
import { saveFeedSource, deleteFeedSource, toggleFeedSource } from '@/app/admin/actions'
import dash from '@/app/dashboard/dashboard.module.css'

function FeedForm({ editing, onDone }) {
  const [state, action, pending] = useActionState(saveFeedSource, null)

  return (
    <form action={action} className={dash.panelCard} style={{ marginBottom: 24 }}>
      <h2>{editing ? `Edit ${editing.name}` : 'Add a feed source'}</h2>
      {state?.error && <div className="alert alertError" role="alert">{state.error}</div>}
      {state?.success && (
        <div className="alert alertSuccess" role="status">{state.success}</div>
      )}
      {editing && <input type="hidden" name="id" value={editing.id} />}
      <label className="field">
        <span>Name</span>
        <input
          className="input"
          type="text"
          name="name"
          required
          defaultValue={editing?.name || ''}
          placeholder="e.g. The Standard"
        />
      </label>
      <label className="field">
        <span>Feed URL</span>
        <input
          className="input"
          type="url"
          name="url"
          required
          defaultValue={editing?.url || ''}
          placeholder="https://example.com/rss.xml"
        />
      </label>
      <label className="field">
        <span>Wire</span>
        <select className="select" name="region" defaultValue={editing?.region || 'kenya'}>
          <option value="kenya">Kenya</option>
          <option value="world">World</option>
        </select>
      </label>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn" type="submit" disabled={pending}>
          {pending ? 'Saving…' : editing ? 'Save changes' : 'Add feed'}
        </button>
        {editing && (
          <button className="btn btnGhost" type="button" onClick={onDone}>
            Cancel edit
          </button>
        )}
      </div>
    </form>
  )
}

export default function FeedsPanel({ feeds }) {
  const [editing, setEditing] = useState(null)

  const kenya = feeds.filter((f) => f.region === 'kenya')
  const world = feeds.filter((f) => f.region === 'world')

  const group = (title, rows) => (
    <section style={{ marginBottom: 26 }}>
      <h2 className="sectionTitle" style={{ fontSize: 22 }}>{title}</h2>
      {rows.length === 0 && (
        <div className="empty" style={{ padding: 24 }}>
          <h3>No sources in this wire</h3>
          <p>Add one with the form — any public RSS/Atom URL works.</p>
        </div>
      )}
      {rows.map((f) => (
        <div key={f.id} className={dash.feedRow}>
          <div>
            <div className={dash.feedName}>
              {f.name}
              {!f.enabled && (
                <span className="badge badgeDraft" style={{ marginLeft: 8 }}>Disabled</span>
              )}
            </div>
            <span className={dash.feedUrl} title={f.url}>{f.url}</span>
          </div>
          <div className={dash.feedActions}>
            <button className="btn btnGhost btnSmall" type="button" onClick={() => setEditing(f)}>
              Edit
            </button>
            <form action={toggleFeedSource}>
              <input type="hidden" name="id" value={f.id} />
              <input type="hidden" name="enabled" value={String(f.enabled)} />
              <button className="btn btnGhost btnSmall" type="submit">
                {f.enabled ? 'Disable' : 'Enable'}
              </button>
            </form>
            <form
              action={deleteFeedSource}
              onSubmit={(e) => {
                if (!confirm(`Remove ${f.name} from the wire?`)) e.preventDefault()
              }}
            >
              <input type="hidden" name="id" value={f.id} />
              <button className="btn btnDanger btnSmall" type="submit">Remove</button>
            </form>
          </div>
        </div>
      ))}
    </section>
  )

  return (
    <>
      <FeedForm editing={editing} onDone={() => setEditing(null)} />
      {group('Kenya wire', kenya)}
      {group('World wire', world)}
    </>
  )
}
