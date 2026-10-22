'use client'

import Link from 'next/link'
import { deleteArticle, setOwnStatus } from '@/app/dashboard/actions'
import { categoryLabel, relativeTime } from '@/lib/site'
import styles from '@/app/dashboard/dashboard.module.css'

const BADGE = {
  draft: 'badgeDraft',
  pending: 'badgePending',
  published: 'badgePublished',
  rejected: 'badgeRejected',
}

const LABEL = {
  draft: 'Draft',
  pending: 'Pending review',
  published: 'Published',
  rejected: 'Rejected',
}

export default function ArticlesTable({ articles }) {
  return (
    <div className="tableWrap">
      <table className="table">
        <thead>
          <tr>
            <th>Story</th>
            <th>Section</th>
            <th>Status</th>
            <th>Updated</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {articles.map((a) => (
            <tr key={a.id}>
              <td style={{ minWidth: 260 }}>
                <Link href={`/news/${a.slug}`} className={styles.rowTitle} target="_blank">
                  {a.title}
                </Link>
                {a.is_featured && <span className="badge badgePublished" style={{ marginLeft: 8 }}>Lead</span>}
                {a.is_breaking && <span className="badge badgeRejected" style={{ marginLeft: 8 }}>Breaking</span>}
              </td>
              <td>{categoryLabel(a.category)}</td>
              <td>
                <span className={`badge ${BADGE[a.status] || 'badgeDraft'}`}>
                  {LABEL[a.status] || a.status}
                </span>
              </td>
              <td style={{ whiteSpace: 'nowrap', color: 'var(--muted)' }}>
                {relativeTime(a.updated_at)}
              </td>
              <td>
                <div className={styles.rowActions}>
                  <Link href={`/dashboard/articles/${a.id}`} className="btn btnGhost btnSmall">
                    Edit
                  </Link>

                  {a.status === 'draft' && (
                    <form action={setOwnStatus.bind(null, a.id, 'pending')}>
                      <button className="btn btnGhost btnSmall" type="submit">
                        Submit
                      </button>
                    </form>
                  )}

                  {a.status === 'pending' && (
                    <form action={setOwnStatus.bind(null, a.id, 'draft')}>
                      <button className="btn btnGhost btnSmall" type="submit">
                        Withdraw
                      </button>
                    </form>
                  )}

                  <form
                    action={deleteArticle.bind(null, a.id)}
                    onSubmit={(e) => {
                      if (!confirm('Delete this story permanently? This cannot be undone.')) {
                        e.preventDefault()
                      }
                    }}
                  >
                    <button className="btn btnDanger btnSmall" type="submit">
                      Delete
                    </button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
