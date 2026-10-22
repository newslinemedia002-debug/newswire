import Link from 'next/link'
import { relativeTime } from '@/lib/site'
import styles from './Stories.module.css'

/**
 * Wire items are read ON Newswire (/wire/[id]) — the original publisher is
 * credited on that page and linked there.
 */
export default function FeedList({ items, withThumbs = false }) {
  if (!items?.length) return null
  return (
    <ul className={styles.feedList}>
      {items.map((item) => (
        <li key={item.id} className={styles.feedItem}>
          <Link href={`/wire/${item.id}`} className={styles.feedLink}>
            <div className={withThumbs && item.image_url ? styles.feedWithThumb : undefined}>
              <div>
                <div className={styles.feedMeta}>
                  <span className={styles.feedSource}>{item.source}</span>
                  <span aria-hidden="true">·</span>
                  <span>{relativeTime(item.published_at)}</span>
                </div>
                <div className={styles.feedTitle}>{item.title}</div>
                {item.excerpt && <p className={styles.feedExcerpt}>{item.excerpt}</p>}
              </div>
              {withThumbs && item.image_url && (
                <div className={styles.feedThumb}>
                  <img src={item.image_url} alt="" loading="lazy" />
                </div>
              )}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
