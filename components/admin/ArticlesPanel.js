'use client'

import Link from 'next/link'
import { moderateArticle } from '@/app/admin/actions'
import { categoryLabel, relativeTime } from '@/lib/site'
import dash from '@/app/dashboard/dashboard.module.css'

const BADGE = {
  draft: 'badgeDraft',
  pending: 'badgePending',
  published: 'badgePublished',
  rejected: 'badgeRejected',
}

function Action({ id, op, children, danger = false, primary = false }) {
  return (
    <form
      action={moderateArticle}
      onSubmit={
        op === 'delete'
          ? (e) => {
              if (!confirm('Delete this article permanently? This cannot be undone.')) {
                e.preventDefault()
              }
            }
          : undefined
      }
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="op" value={op} />
      <button
        className={`btn btnSmall${danger ? ' btnDanger' : primary ? '' : ' btnGhost'}`}
        type="submit"
      >
        {children}
      </button>
    </form>
  )
}

export default function ArticlesPanel({ articles }) {
  if (!articles.length) {
    return (
      <div className="empty">
        <h3>No articles in this view</h3>
        <p>Switch tabs above, or publish a story from the dashboard.</p>
      </div>
    )
  }

  return (
    <div className="tableWrap">
      <table className="table">
        <thead>
          <tr>
            <th>Story</th>
            <th>Author</th>
            <th>Status</th>
            <th>Updated</th>
            <th style={{ textAlign: 'right' }}>Manage</th>
          </tr>
        </thead>
        <tbody>
          {articles.map((a) => (
            <tr key={a.id}>
              <td style={{ minWidth: 280 }}>
                <Link href={`/news/${a.slug}`} className={dash.rowTitle} target="_blank">
                  {a.title}
                </Link>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                  {categoryLabel(a.category)}
                  {a.is_featured && ' · LEAD STORY'}
                  {a.is_breaking && ' · BREAKING'}
                </div>
              </td>
              <td>{a.author_name}</td>
              <td>
                <span className={`badge ${BADGE[a.status] || 'badgeDraft'}`}>{a.status}</span>
              </td>
              <td style={{ whiteSpace: 'nowrap', color: 'var(--muted)' }}>
                {relativeTime(a.updated_at)}
              </td>
              <td>
                <div className={dash.rowActions}>
                  {a.status !== 'published' && (
                    <Action id={a.id} op="publish" primary>Publish</Action>
                  )}
                  {a.status === 'published' && (
                    <Action id={a.id} op="unpublish">Unpublish</Action>
                  )}
                  {a.status === 'published' && (
                    <Action id={a.id} op={a.is_featured ? 'unfeature' : 'feature'}>
                      {a.is_featured ? 'Unfeature' : 'Make lead'}
                    </Action>
                  )}
                  {a.status === 'published' && (
                    <Action id={a.id} op={a.is_breaking ? 'unbreak' : 'break'}>
                      {a.is_breaking ? 'Clear breaking' : 'Breaking'}
                    </Action>
                  )}
                  {a.status === 'pending' && <Action id={a.id} op="reject">Reject</Action>}
                  <Link href={`/dashboard/articles/${a.id}`} className="btn btnGhost btnSmall">
                    Edit
                  </Link>
                  <Action id={a.id} op="delete" danger>Delete</Action>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
