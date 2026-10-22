import { createPageClient } from '@/lib/supabase/server'
import { searchArticles } from '@/lib/articles'
import StoryCard from '@/components/StoryCard'
import styles from '@/components/Stories.module.css'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Search',
  description: 'Search Newswire’s published stories.',
}

export default async function SearchPage({ searchParams }) {
  const sp = await searchParams
  const q = String(sp?.q || '').trim().slice(0, 120)

  let results = []
  let failed = false
  if (q) {
    try {
      const supabase = await createPageClient()
      results = await searchArticles(supabase, q, { limit: 24 })
    } catch {
      failed = true
    }
  }

  return (
    <div className="container">
      <h1 className="sectionTitle" style={{ marginTop: 24 }}>Search</h1>

      <form action="/search" method="GET" role="search" style={{ maxWidth: 560, marginBottom: 28 }}>
        <label className="field">
          <span>Search published stories</span>
          <input
            className="input"
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Try “Nairobi”, “markets”, “technology”…"
            required
          />
        </label>
        <button className="btn" type="submit">Search</button>
      </form>

      {q && !failed && results.length === 0 && (
        <div className="empty">
          <h3>No stories match “{q}”</h3>
          <p>Try a shorter or more general word — or browse the section pages from the menu.</p>
        </div>
      )}

      {failed && (
        <div className="alert alertError">Search is temporarily unavailable. Please try again.</div>
      )}

      {results.length > 0 && (
        <>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>
            {results.length} result{results.length === 1 ? '' : 's'} for “{q}”
          </p>
          <div className={styles.grid3}>
            {results.map((a) => (
              <StoryCard key={a.id} article={a} variant="card" />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
