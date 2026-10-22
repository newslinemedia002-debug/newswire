import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import ArticleForm from '@/components/ArticleForm'
import { updateArticle } from '@/app/dashboard/actions'
import styles from '@/app/dashboard/dashboard.module.css'

export const metadata = { title: 'Edit article' }
export const dynamic = 'force-dynamic'

export default async function EditArticlePage({ params }) {
  const { id } = await params
  const { supabase, profile } = await requireUser('/dashboard')

  const { data: article } = await supabase
    .from('articles')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (!article) notFound()

  return (
    <div className={`container ${styles.page}`}>
      <div className={styles.head}>
        <div>
          <h1 className={styles.title}>Edit article</h1>
          <p className={styles.sub}>Changes go live immediately if the story is already published.</p>
        </div>
      </div>
      <div style={{ maxWidth: 860, marginTop: 18 }}>
        <ArticleForm
          mode="edit"
          action={updateArticle.bind(null, article.id)}
          article={article}
          isAdmin={profile.role === 'admin'}
        />
      </div>
    </div>
  )
}
