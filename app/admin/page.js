import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { moderateArticle } from '@/app/admin/actions'
import { relativeTime } from '@/lib/site'
import styles from '@/app/admin/admin.module.css'
import dash from '@/app/dashboard/dashboard.module.css'

export const metadata = { title: 'Admin overview' }

export default async function AdminOverviewPage({ searchParams }) {
  const { supabase, profile } = await requireAdmin('/admin')
  const sp = await searchParams
  const adminCli = createAdminClient()

  const [counts, pending, usersRes, feedsRes] = await Promise.all([
    Promise.all([
      supabase.from('articles').select('id', { count: 'exact', head: true }),
      supabase.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
    ]),
    supabase
      .from('articles')
      .select('id, title, slug, author_name, category, created_at, updated_at')
      .eq('status', 'pending')
      .order('updated_at', { ascending: false })
      .limit(8),
    adminCli.auth.admin.listUsers({ perPage: 1 }),
    adminCli.from('feed_sources').select('id, enabled'),
  ])

  const total = counts[0].count ?? 0
  const published = counts[1].count ?? 0
  const pendingCount = counts[2].count ?? 0
  const drafts = counts[3].count ?? 0
  const userTotal = usersRes.data?.total ?? usersRes.data?.users?.length ?? 0
  const feeds = feedsRes.data?.length ?? 0

  const errorMsg = sp?.error ? String(sp.error).slice(0, 300) : null
  const okMsg = sp?.ok ? String(sp.ok).slice(0, 300) : null

  return (
    <>
      <h1 className={styles.title}>Overview</h1>
      <p className={styles.sub}>
        Signed in as {profile.email} · everything on the site, at a glance.
      </p>

      {errorMsg && <div className="alert alertError" role="alert">{errorMsg}</div>}
      {okMsg && <div className="alert alertSuccess" role="status">{okMsg}</div>}

      <div className={dash.stats}>
        <div className={dash.stat}>
          <div className={dash.statNum}>{total}</div>
          <div className={dash.statLabel}>Total articles</div>
        </div>
        <div className={dash.stat}>
          <div className={dash.statNum}>{published}</div>
          <div className={dash.statLabel}>Published</div>
        </div>
        <div className={dash.stat}>
          <div className={dash.statNum}>{pendingCount}</div>
          <div className={dash.statLabel}>Awaiting review</div>
        </div>
        <div className={dash.stat}>
          <div className={dash.statNum}>{drafts}</div>
          <div className={dash.statLabel}>Drafts</div>
        </div>
        <div className={dash.stat}>
          <div className={dash.statNum}>{userTotal}</div>
          <div className={dash.statLabel}>Users</div>
        </div>
        <div className={dash.stat}>
          <div className={dash.statNum}>{feeds}</div>
          <div className={dash.statLabel}>RSS sources</div>
        </div>
      </div>

      <section aria-label="Awaiting review" style={{ marginTop: 8 }}>
        <h2 className="sectionTitle" style={{ fontSize: 24 }}>
          Awaiting review{pendingCount > 0 ? ` (${pendingCount})` : ''}
        </h2>

        {(pending.data || []).length === 0 ? (
          <div className="empty">
            <h3>Review queue is clear</h3>
            <p>Stories submitted by authors will show up here for publishing.</p>
          </div>
        ) : (
          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Story</th>
                  <th>Author</th>
                  <th>Submitted</th>
                  <th style={{ textAlign: 'right' }}>Decision</th>
                </tr>
              </thead>
              <tbody>
                {(pending.data || []).map((a) => (
                  <tr key={a.id}>
                    <td style={{ minWidth: 260 }}>
                      <strong style={{ fontFamily: 'var(--serif)' }}>{a.title}</strong>
                    </td>
                    <td>{a.author_name}</td>
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--muted)' }}>
                      {relativeTime(a.updated_at)}
                    </td>
                    <td>
                      <div className={dash.rowActions}>
                        <form action={moderateArticle}>
                          <input type="hidden" name="id" value={a.id} />
                          <input type="hidden" name="op" value="publish" />
                          <button className="btn btnSmall" type="submit">Publish</button>
                        </form>
                        <form action={moderateArticle}>
                          <input type="hidden" name="id" value={a.id} />
                          <input type="hidden" name="op" value="reject" />
                          <button className="btn btnGhost btnSmall" type="submit">Reject</button>
                        </form>
                        <Link href={`/dashboard/articles/${a.id}`} className="btn btnGhost btnSmall">
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}
