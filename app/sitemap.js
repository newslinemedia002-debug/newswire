import { createClient } from '@supabase/supabase-js'
import { CATEGORIES, siteUrl } from '@/lib/site'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
)

export default async function sitemap() {
  const base = siteUrl()

  const staticEntries = [
    { url: base, changeFrequency: 'hourly', priority: 1 },
    ...CATEGORIES.map((c) => ({
      url: `${base}/section/${c.slug}`,
      changeFrequency: 'hourly',
      priority: 0.8,
    })),
    { url: `${base}/search`, changeFrequency: 'weekly', priority: 0.3 },
  ]

  let articles = []
  try {
    const { data } = await supabase
      .from('articles')
      .select('slug, updated_at, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(1000)
    articles = data || []
  } catch {
    articles = []
  }

  return [
    ...staticEntries,
    ...articles.map((a) => ({
      url: `${base}/news/${a.slug}`,
      lastModified: a.updated_at || a.published_at,
      changeFrequency: 'daily',
      priority: 0.7,
    })),
  ]
}
