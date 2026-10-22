import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import ArticlesTable from '@/components/ArticlesTable'
import styles from './dashboard.module.css'

export const metadata = { title: 'Dashboard' }
export const dynamic = 'force-dynamic'

const MESSAGES = {
  created: ['success', 'Draft saved. You can submit it for review whenever it is ready.'],
  submitted: ['success', 'Story submitted for review — an admin will publish it.'],
  withdrawn: ['info', 'Story moved back to your drafts.'],
  updated: ['success', 'Changes saved.'],
  deleted: ['success', 'Story deleted.'],
  created_user: ['success', 'Done.'],
}

export default async function DashboardPage({ searchParams }) {
  const { supabase, user, profile } = await requireUser('/dashboard')
  const sp = await searchParams

  const { data: articles = [] } = await supabase
    .from('articles')
    .select(
      'id, title, slug, category, status, updated_at, created_at, is_featured, is_breaking'
    )
    .eq('author_id', user.id)
    .order('updated_at', { ascending: false })

  const counts = {
    total: articles.length,
    published: articles.filter((a) => a.status === 'published').length,
    pending: articles.filter((a) => a.status === 'pending').length,
    drafts: articles.filter((a) => a.status === 'draft' || a.status === 'rejected').length,
  }

  const flash = MESSAGES[sp?.created ? 'created' : sp?.submitted ? 'submitted' : sp?.withdrawn ? 'withdrawn' : sp?.updated ? 'updated' : sp?.deleted ? 'deleted' : null]
  const errorMsg = sp?.error ? String(sp.error).slice(0, 300) : null

  return (
    <div className={`container ${styles.page}`}>
      <div className={styles.head}>
        <div>
          <h1 className={styles.title}>
            Welcome{profile.full_name ? `, ${(profile.full_name || '').split(' ')[0]}` : ''}
          </h1>
          <p className={styles.sub}>
            Your stories and drafts. {profile.role === 'admin' && 'You are an admin — manage everything from the admin panel.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {profile.role === 'admin' && (
            <Link href="/admin" className="btn btnGhost">Admin panel</Link>
          )}
          <Link href="/dashboard/articles/new" className="btn">＋ New article</Link>
        </div>
      </div>

      {errorMsg && (
        <div className="alert alertError" role="alert">
          {errorMsg}
        </div>
      )}
      {flash && (
        <div className={`alert alert${flash[0] === 'success' ? 'Success' : 'Info'}`} role="status">
          {flash[1]}
        </div>
      )}

      <div className={styles.stats}>
        <div className={styles.stat}>
          <div className={styles.statNum}>{counts.total}</div>
          <div className={styles.statLabel}>Your stories</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statNum}>{counts.published}</div>
          <div className={styles.statLabel}>Published</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statNum}>{counts.pending}</div>
          <div className={styles.statLabel}>Awaiting review</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statNum}>{counts.drafts}</div>
          <div className={styles.statLabel}>Drafts</div>
        </div>
      </div>

      {articles.length === 0 ? (
        <div className="empty">
          <h3>You have not written anything yet</h3>
          <p>Your drafts, submissions and published stories will all appear here.</p>
          <p style={{ marginTop: 16 }}>
            <Link href="/dashboard/articles/new" className="btn">
              Write your first story
            </Link>
          </p>
        </div>
      ) : (
        <ArticlesTable articles={articles} />
      )}
    </div>
  )
}
