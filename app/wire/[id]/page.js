import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createPublicClient } from '@/lib/supabase/server'
import { getWireItems } from '@/lib/feeds'
import { SITE_NAME, formatDate, relativeTime } from '@/lib/site'
import ArticleBody from '@/components/ArticleBody'
import styles from '@/app/article.module.css'
import wire from '@/app/wire/wire.module.css'

export const revalidate = 600

async function getItem(id) {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('wire_items')
    .select('id, source, title, excerpt, body, image_url, external_url, published_at, region')
    .eq('id', id)
    .maybeSingle()
  return data
}

export async function generateMetadata({ params }) {
  const { id } = await params
  const item = await getItem(id)
  if (!item) return { title: 'Wire story not found' }

  const title = `${item.title} — ${item.source}`
  const description = item.excerpt || `From the ${item.source} wire on ${SITE_NAME}.`
  const url = `/wire/${item.id}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      publishedTime: item.published_at || undefined,
      authors: [item.source],
      ...(item.image_url
        ? { images: [{ url: item.image_url, alt: item.title }] }
        : {}),
    },
    twitter: {
      card: item.image_url ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(item.image_url ? { images: [item.image_url] } : {}),
    },
  }
}

export default async function WirePage({ params }) {
  const { id } = await params
  const item = await getItem(id)
  if (!item) notFound()

  const admin = createPublicClient()
  const related = await getWireItems(admin, item.region, { limit: 5 }).catch(() => [])
  const more = related.filter((r) => r.id !== item.id).slice(0, 4)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: item.title,
    description: item.excerpt,
    datePublished: item.published_at || undefined,
    author: { '@type': 'Organization', name: item.source },
    publisher: {
      '@type': 'NewsMediaOrganization',
      name: SITE_NAME,
    },
    mainEntityOfPage: `/wire/${item.id}`,
    isBasedOn: item.external_url,
    ...(item.image_url ? { image: [item.image_url] } : {}),
  }

  return (
    <div className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href="/#wire">{item.region === 'kenya' ? 'Kenyan headlines' : 'World headlines'}</Link>
        <span aria-hidden="true">/</span>
        <span className={styles.crumbSource}>{item.source}</span>
      </nav>

      <p className={styles.sourceLine}>
        <span className={styles.sourcePill}>{item.source}</span>
        <span>{relativeTime(item.published_at)}</span>
      </p>

      <h1 className={styles.headline}>{item.title}</h1>

      {item.image_url && (
        <figure className={styles.hero}>
          <img src={item.image_url} alt={item.title} />
        </figure>
      )}

      <div className={styles.layout}>
        <div className={styles.body}>
          <ArticleBody content={item.body || item.excerpt} />
        </div>

        <aside className={styles.attribution}>
          <h2>Who reported this</h2>
          <p>
            This story comes from <strong>{item.source}</strong>, aggregated by {SITE_NAME}’s live
            wire. Rights in the article remain with {item.source}.
          </p>
          <a
            className="btn"
            href={item.external_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Read original at {item.source} →
          </a>
          <p className={styles.attributionNote}>
            Published {formatDate(item.published_at)} · Always verify details at the original
            source.
          </p>
        </aside>
      </div>

      {more.length > 0 && (
        <section aria-label="More from the wire" style={{ marginTop: 44 }}>
          <h2 className="sectionTitle" style={{ fontSize: 22 }}>
            More from the {item.region === 'kenya' ? 'Kenyan' : 'world'} wire
          </h2>
          <ul className={styles.moreList}>
            {more.map((r) => (
              <li key={r.id}>
                <Link href={`/wire/${r.id}`}>
                  <span className={styles.moreSource}>{r.source}</span>
                  <span className={styles.moreTitle}>{r.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
