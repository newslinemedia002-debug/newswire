import Link from 'next/link'
import styles from './Stories.module.css'

export default function BreakingStrip({ article }) {
  if (!article) return null
  return (
    <Link href={`/news/${article.slug}`} className={styles.breaking}>
      <span className={styles.breakingLabel}>Breaking</span>
      <span className={styles.breakingTitle}>{article.title}</span>
    </Link>
  )
}
