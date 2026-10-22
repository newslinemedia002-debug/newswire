import Link from 'next/link'
import styles from './Stories.module.css'

export default function MostRead({ articles }) {
  if (!articles?.length) return null
  return (
    <aside className={styles.mostRead} aria-label="Most read">
      <h2>Most read</h2>
      <ol>
        {articles.map((a) => (
          <li key={a.id}>
            <Link href={`/news/${a.slug}`}>{a.title}</Link>
          </li>
        ))}
      </ol>
    </aside>
  )
}
