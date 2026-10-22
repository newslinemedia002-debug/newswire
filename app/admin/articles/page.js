import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import ArticlesPanel from '@/components/admin/ArticlesPanel'
import styles from '@/app/admin/admin.module.css'
import local from './articles.module.css'

export const metadata = { title: 'Manage articles' }

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'published', label: 'Published' },
  { key: 'draft', label: 'Drafts' },
  { key: 'rejected', label: 'Rejected' },
]

export default async function AdminArticlesPage({ searchParams }) {
  const sp = await searchParams
  const tab = TABS.some((t) => t.key === sp?.tab) ? sp.tab : 'all'

  const { supabase } = await requireAdmin('/admin/articles')
  const errorMsg = sp?.error ? String(sp.error).slice(0, 300) : null
  const okMsg = sp?.ok ? String(sp.ok).slice(0, 300) : null
  const { data = [] } = await supabase
    .from('articles')
    .select('id, title, slug, author_name, category, status, is_featured, is_breaking, updated_at')
    .order('updated_at', { ascending: false })
    .limit(300)

  const counts = TABS.reduce((acc, t) => {
    acc[t.key] = t.key === 'all' ? data.length : data.filter((a) => a.status === t.key).length
    return acc
  }, {})

  const shown = tab === 'all' ? data : data.filter((a) => a.status === tab)

  return (
    <>
      <h1 className={styles.title}>Articles</h1>
      <p className={styles.sub}>
        Publish, feature, mark as breaking, edit or delete any story on the site.
      </p>

      {errorMsg && <div className="alert alertError" role="alert">{errorMsg}</div>}
      {okMsg && <div className="alert alertSuccess" role="status">{okMsg}</div>}

      <nav className={local.tabs} aria-label="Filter by status">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.key === 'all' ? '/admin/articles' : `/admin/articles?tab=${t.key}`}
            className={`${local.tab} ${tab === t.key ? local.tabActive : ''}`}
          >
            {t.label}
            <span className={local.tabCount}>{counts[t.key]}</span>
          </Link>
        ))}
      </nav>

      <ArticlesPanel articles={shown} />
    </>
  )
}
