import { requireUser } from '@/lib/auth'
import ArticleForm from '@/components/ArticleForm'
import { createArticle } from '@/app/dashboard/actions'
import styles from '@/app/dashboard/dashboard.module.css'

export const metadata = { title: 'New article' }
export const dynamic = 'force-dynamic'

export default async function NewArticlePage() {
  const { profile } = await requireUser('/dashboard/articles/new')

  return (
    <div className={`container ${styles.page}`}>
      <div className={styles.head}>
        <div>
          <h1 className={styles.title}>New article</h1>
          <p className={styles.sub}>
            Write it, then keep it as a draft or send it straight for admin review.
          </p>
        </div>
      </div>
      <div style={{ maxWidth: 860, marginTop: 18 }}>
        <ArticleForm mode="create" action={createArticle} isAdmin={profile.role === 'admin'} />
      </div>
    </div>
  )
}
