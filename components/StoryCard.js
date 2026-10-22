import Link from 'next/link'
import { categoryLabel, relativeTime } from '@/lib/site'
import styles from './Stories.module.css'

function Meta({ article }) {
  return (
    <div className={`meta ${styles.metaRow}`}>
      <span className="time">{relativeTime(article.published_at || article.created_at)}</span>
      <span className="sep">|</span>
      <Link href={`/section/${article.category}`}>{categoryLabel(article.category)}</Link>
    </div>
  )
}

export default function StoryCard({ article, variant = 'card' }) {
  const href = `/news/${article.slug}`
  const showImage = variant === 'lead' || variant === 'card'

  return (
    <article className={`${styles.card} ${styles[variant]}`}>
      {showImage && article.cover_image_url && (
        <Link href={href} className={styles.cardMedia} tabIndex={-1} aria-hidden="true">
          <img src={article.cover_image_url} alt="" loading={variant === 'lead' ? 'eager' : 'lazy'} />
        </Link>
      )}
      {article.is_breaking && variant === 'lead' && (
        <span className="breakingChip" style={{ marginBottom: 8 }}>Breaking</span>
      )}
      <h3 className={styles.cardTitle}>
        <Link href={href}>{article.title}</Link>
      </h3>
      {article.excerpt && variant !== 'compact' && variant !== 'small' && (
        <p className={styles.cardExcerpt}>{article.excerpt}</p>
      )}
      <Meta article={article} />
    </article>
  )
}
