import Link from 'next/link'
import { createPublicClient, createAdminClient } from '@/lib/supabase/server'
import {
  getFeatured,
  getBreaking,
  getLatest,
  getByCategory,
  getMostRead,
} from '@/lib/articles'
import { loadWire } from '@/lib/feeds'
import { CATEGORIES, categoryLabel, SITE_NAME, SITE_TAGLINE, SITE_DESCRIPTION, absUrl } from '@/lib/site'
import StoryCard from '@/components/StoryCard'
import FeedList from '@/components/FeedList'
import MostRead from '@/components/MostRead'
import BreakingStrip from '@/components/BreakingStrip'
import styles from '@/components/Stories.module.css'

export const revalidate = 600

export async function generateMetadata() {
  const supabase = createPublicClient()
  const [featured, breaking] = await Promise.all([
    getFeatured(supabase),
    getBreaking(supabase),
  ])
  const lead = featured || breaking || (await getLatest(supabase, { limit: 1 }))[0] || null

  const title = lead ? lead.title : `${SITE_NAME} — ${SITE_TAGLINE}`
  const description = lead ? lead.excerpt : SITE_DESCRIPTION
  const image = lead ? absUrl(lead.cover_image_url) : null

  const og = {
    title,
    description,
    url: '/',
    siteName: SITE_NAME,
    type: 'website',
    locale: 'en_KE',
    ...(image ? { images: [{ url: image, width: 1200, height: 675, alt: lead.title }] } : {}),
  }

  return {
    title,
    description,
    alternates: { canonical: '/' },
    openGraph: og,
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  }
}

function SectionHead({ title, href }) {
  return (
    <div className={styles.sectionLabel}>
      <h2>{title}</h2>
      {href && <Link href={href}>More {title} →</Link>}
    </div>
  )
}

function EmptySection({ label }) {
  return (
    <div className="empty">
      <h3>Nothing published in {label} yet</h3>
      <p>Published stories will appear here as soon as the newsroom files one.</p>
    </div>
  )
}

export default async function HomePage() {
  const supabase = createPublicClient()
  const admin = createAdminClient()

  const [
    featured,
    breaking,
    top,
    mostRead,
    kenyaOwn,
    worldOwn,
    africaOwn,
    businessOwn,
    techOwn,
    entOwn,
    kenyaFeed,
    worldFeed,
  ] = await Promise.all([
    getFeatured(supabase),
    getBreaking(supabase),
    getLatest(supabase, { limit: 12 }),
    getMostRead(supabase, { limit: 5 }),
    getByCategory(supabase, 'kenya', { limit: 4 }),
    getByCategory(supabase, 'world', { limit: 4 }),
    getByCategory(supabase, 'africa', { limit: 4 }),
    getByCategory(supabase, 'business', { limit: 4 }),
    getByCategory(supabase, 'tech', { limit: 4 }),
    getByCategory(supabase, 'entertainment', { limit: 4 }),
    loadWire(admin, 'kenya', { limit: 8 }),
    loadWire(admin, 'world', { limit: 8 }),
  ])

  const lead = featured || top[0] || null
  const rest = top.filter((a) => a.id !== lead?.id && a.id !== breaking?.id)
  const leftStack = rest.slice(0, 2)
  const rightStack = rest.slice(2, 6)
  const grid = rest.slice(6, 10)

  const splitList = (items) => {
    const half = Math.ceil(items.length / 2)
    return [items.slice(0, half), items.slice(half)]
  }
  const [kenyaA, kenyaB] = splitList(kenyaFeed)
  const [worldA, worldB] = splitList(worldFeed)

  const secondarySections = [
    { slug: 'africa', items: africaOwn },
    { slug: 'business', items: businessOwn },
    { slug: 'tech', items: techOwn },
    { slug: 'entertainment', items: entOwn },
  ].filter((s) => s.items.length > 0)

  return (
    <>
      <div className="container">
        {breaking && <div style={{ marginTop: 14 }}><BreakingStrip article={breaking} /></div>}

        {lead ? (
          <div className={styles.leadGrid3}>
            <div className={styles.colStack}>
              {leftStack.map((a) => (
                <StoryCard key={a.id} article={a} variant="card" />
              ))}
            </div>

            <StoryCard article={lead} variant="lead" />

            <div className={styles.colStack}>
              {rightStack.length > 0 ? (
                rightStack.map((a) => <StoryCard key={a.id} article={a} variant="compact" />)
              ) : (
                <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>
                  More published stories will appear in this column.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="empty" style={{ marginTop: 24 }}>
            <h3>The newsroom is warming up</h3>
            <p>No stories have been published yet. Sign in to publish the first one.</p>
          </div>
        )}

        {grid.length > 0 && (
          <section aria-label="Top stories">
            <SectionHead title="Top stories" />
            <div className={styles.topRow}>
              <div className={styles.grid4}>
                {grid.map((a) => (
                  <StoryCard key={a.id} article={a} variant="card" />
                ))}
              </div>
              <MostRead articles={mostRead} />
            </div>
          </section>
        )}

        <section aria-label="Kenyan headlines">
          <SectionHead title="Kenyan headlines" />
          {kenyaFeed.length > 0 ? (
            kenyaB.length > 0 ? (
              <div className={styles.wireSplit}>
                <FeedList items={kenyaA} withThumbs />
                <FeedList items={kenyaB} withThumbs />
              </div>
            ) : (
              <FeedList items={kenyaA} withThumbs />
            )
          ) : (
            <div className="empty">
              <h3>The Kenyan wire is quiet</h3>
              <p>Feed sources could not be reached just now — check the admin panel.</p>
            </div>
          )}
        </section>

        <section aria-label="Kenya">
          <SectionHead title="Kenya" href="/section/kenya" />
          {kenyaOwn.length > 0 ? (
            <div className={styles.grid4}>
              {kenyaOwn.map((a) => (
                <StoryCard key={a.id} article={a} variant="card" />
              ))}
            </div>
          ) : (
            <EmptySection label="Kenya" />
          )}
        </section>

        <section aria-label="World headlines">
          <SectionHead title="World headlines" />
          {worldFeed.length > 0 ? (
            worldB.length > 0 ? (
              <div className={styles.wireSplit}>
                <FeedList items={worldA} withThumbs />
                <FeedList items={worldB} withThumbs />
              </div>
            ) : (
              <FeedList items={worldA} withThumbs />
            )
          ) : (
            <div className="empty">
              <h3>The world wire is quiet</h3>
              <p>Feed sources could not be reached just now — check the admin panel.</p>
            </div>
          )}
        </section>

        <section aria-label="World">
          <SectionHead title="World" href="/section/world" />
          {worldOwn.length > 0 ? (
            <div className={styles.grid4}>
              {worldOwn.map((a) => (
                <StoryCard key={a.id} article={a} variant="card" />
              ))}
            </div>
          ) : (
            <EmptySection label="World" />
          )}
        </section>

        {secondarySections.map((s) => (
          <section key={s.slug} aria-label={categoryLabel(s.slug)}>
            <SectionHead title={categoryLabel(s.slug)} href={`/section/${s.slug}`} />
            <div className={styles.grid4}>
              {s.items.map((a) => (
                <StoryCard key={a.id} article={a} variant="card" />
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  )
}
