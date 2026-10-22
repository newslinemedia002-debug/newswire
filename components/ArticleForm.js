'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { CATEGORIES } from '@/lib/site'

const STATUS_LABEL = {
  draft: 'Draft',
  pending: 'Pending review',
  published: 'Published',
  rejected: 'Rejected',
}

export default function ArticleForm({ mode, action, article = null, isAdmin = false }) {
  const [state, formAction, pending] = useActionState(action, null)
  const [fileName, setFileName] = useState('')

  return (
    <form action={formAction}>
      {state?.error && (
        <div className="alert alertError" role="alert">
          {state.error}
        </div>
      )}

      <label className="field">
        <span>Headline</span>
        <input
          className="input"
          type="text"
          name="title"
          defaultValue={article?.title || ''}
          required
          maxLength={180}
          placeholder="Say what happened, in one line"
          autoFocus={!article}
        />
      </label>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 16 }}>
        <label className="field">
          <span>Section</span>
          <select className="select" name="category" defaultValue={article?.category || 'world'}>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        {isAdmin && (
          <label className="field">
            <span>Status</span>
            <select className="select" name="status" defaultValue={article?.status || 'draft'}>
              {['draft', 'pending', 'published', 'rejected'].map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <label className="field">
        <span>
          Standfirst / summary <span className="hint">— shown in previews and social shares</span>
        </span>
        <textarea
          className="textarea"
          name="excerpt"
          defaultValue={article?.excerpt || ''}
          rows={2}
          maxLength={400}
          placeholder="One or two sentences that summarise the story"
          style={{ minHeight: 80 }}
        />
      </label>

      <label className="field">
        <span>Story body</span>
        <span className="hint" style={{ fontWeight: 400, display: 'block', marginBottom: 6, color: 'var(--muted)', fontSize: 13 }}>
          Each new line becomes a paragraph. No HTML needed.
        </span>
        <textarea
          className="textarea big"
          name="content"
          defaultValue={article?.content || ''}
          required
          placeholder={'Write the opening paragraph…\n\nThen a new paragraph begins after a blank line.'}
        />
      </label>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 16 }}>
        <label className="field">
          <span>
            Cover image <strong aria-hidden="true" style={{ color: 'var(--live)' }}>*</strong>{' '}
            {article?.cover_image_url && <span className="hint">— leave empty to keep current</span>}
          </span>
          <input
            className="input"
            type="file"
            name="cover"
            accept="image/*"
            onChange={(e) => setFileName(e.target.files?.[0]?.name || '')}
          />
          {fileName && (
            <span className="hint" style={{ display: 'block', marginTop: 6, color: 'var(--muted)', fontSize: 13 }}>
              Selected: {fileName}
            </span>
          )}
        </label>
        <label className="field">
          <span>
            …or image URL <span className="hint">— required unless a cover is already set; web address of an existing image</span>
          </span>
          <input
            className="input"
            type="url"
            name="cover_url"
            defaultValue={article?.cover_image_url && /^https?:/.test(article.cover_image_url) ? article.cover_image_url : ''}
            placeholder="https://…"
          />
        </label>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
        <button className="btn" type="submit" name="intent" value="draft" disabled={pending}>
          {pending ? 'Saving…' : mode === 'create' ? 'Save draft' : 'Save changes'}
        </button>
        {mode === 'create' && (
          <button className="btn btnGhost" type="submit" name="intent" value="pending" disabled={pending}>
            {pending ? 'Saving…' : 'Save & submit for review'}
          </button>
        )}
        <Link href="/dashboard" className="btn btnGhost" style={{ border: 0 }}>
          Cancel
        </Link>
        {article && (
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>
            Status: <strong>{STATUS_LABEL[article.status] || article.status}</strong>
          </span>
        )}
      </div>
    </form>
  )
}
