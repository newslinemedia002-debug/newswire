import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createPublicClient } from '@/lib/supabase/server'
import { getArticleBySlug, getByCategory, getLatest, LIST_FIELDS } from '@/lib/articles'
import { SITE_NAME, categoryLabel, formatDate, absUrl, siteUrl } from '@/lib/site'
import ArticleBody from '@/components/ArticleBody'
import ViewTracker from '@/components/ViewTracker'
import StoryCard from '@/components/StoryCard'
import MostRead from '@/components/MostRead'
import styles from '@/app/article.module.css'

export const revalidate = 300

export async function generateMetadata({ params }) {
  const { slug } = await params
  const supabase = createPublicClient()
  const article = await getArticleBySlug(supabase, slug)
  if (!article) return { title: 'Story not found' }

  const image = absUrl(article.cover_image_url)
  const url = `/news/${article.slug}`

  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: url },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      url,
      type: 'article',
      publishedTime: article.published_at || undefined,
      authors: [article.author_name],
      section: categoryLabel(article.category),
      ...(image ? { images: [{ url: image, width: 1200, height: 675, alt: article.title }] } : {}),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title: article.title,
      description: article.excerpt,
      ...(image ? { images: [image] } : {}),
    },
  }
}

export default async function ArticlePage({ params }) {
  const { slug } = await params
  const supabase = createPublicClient()
  const article = await getArticleBySlug(supabase, slug)
  if (!article) notFound()

  const [related, mostRead] = await Promise.all([
    getByCategory(supabase, article.category, { limit: 3 }).then((rows) =>
      rows.filter((a) => a.id !== article.id).slice(0, 3)
    ),
    getLatest(supabase, { limit: 4 }).catch(() => []),
  ])

  const image = absUrl(article.cover_image_url)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.excerpt,
    datePublished: article.published_at || article.created_at,
    dateModified: article.updated_at,
    articleSection: categoryLabel(article.category),
    author: { '@type': 'Person', name: article.author_name },
    publisher: {
      '@type': 'NewsMediaOrganization',
      name: SITE_NAME,
      url: siteUrl(),
      logo: { '@type': 'ImageObject', url: `${siteUrl}/icon.svg` },
    },
    mainEntityOfPage: `${siteUrl()}/news/${article.slug}`,
    ...(image ? { image: [image] } : {}),
  }

  return (
    <div className="container">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ViewTracker slug={article.slug} />

      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/section/${article.category}`}>{categoryLabel(article.category)}</Link>
      </nav>

      <h1 className={styles.headline}>
        {article.is_breaking && <span className="breakingChip" style={{ marginRight: 10 }}>Breaking</span>}
        {article.title}
      </h1>
      <p className={styles.standfirst}>{article.excerpt}</p>

      <div className={styles.byline}>
        <span>By <strong>{article.author_name}</strong></span>
        <span aria-hidden="true">·</span>
        <time dateTime={article.published_at || article.created_at}>
          {formatDate(article.published_at || article.created_at)}
        </time>
        <span aria-hidden="true">·</span>
        <span>{categoryLabel(article.category)}</span>
      </div>

      {image && (
        <figure className={styles.hero}>
          <img src={image} alt={article.title} />
        </figure>
      )}

      <div className={styles.layout}>
        <div>
          <div className={styles.body}>
            <ArticleBody content={article.content} />
          </div>
          <div className={styles.tags}>
            <Link href={`/section/${article.category}`} className={styles.tag}>
              {categoryLabel(article.category)}
            </Link>
            <Link href="/" className={styles.tag}>Latest stories</Link>
            <span className={`${styles.tag} ${styles.share}`} style={{ borderStyle: 'dashed' }}>
              Copy this page’s link to share it
            </span>
          </div>
        </div>

        <aside className={styles.aside}>
          {related.length > 0 && (
            <section aria-label="Related stories">
              <h2 className="sectionTitle" style={{ fontSize: 22 }}>Related stories</h2>
              <div style={{ display: 'grid', gap: 20 }}>
                {related.map((a) => (
                  <StoryCard key={a.id} article={a} variant="small" />
                ))}
              </div>
            </section>
          )}
          <MostRead articles={mostRead} />
        </aside>
      </div>
    </div>
  )
}
