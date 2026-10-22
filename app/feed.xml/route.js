import { createClient } from '@supabase/supabase-js'
import { SITE_NAME, SITE_DESCRIPTION, siteUrl, categoryLabel } from '@/lib/site'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
)

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function GET() {
  const base = siteUrl()

  let articles = []
  try {
    const { data } = await supabase
      .from('articles')
      .select('title, slug, excerpt, author_name, category, published_at, cover_image_url')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(30)
    articles = data || []
  } catch {
    articles = []
  }

  const items = articles
    .map((a) => {
      const url = `${base}/news/${a.slug}`
      const image = a.cover_image_url
        ? /^https?:/.test(a.cover_image_url)
          ? a.cover_image_url
          : `${base}${a.cover_image_url.startsWith('/') ? '' : '/'}${a.cover_image_url}`
        : null
      return `    <item>
      <title>${esc(a.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${esc(a.excerpt)} — ${esc(categoryLabel(a.category))}, ${esc(a.author_name)}</description>
      <pubDate>${new Date(a.published_at || Date.now()).toUTCString()}</pubDate>
      <category>${esc(categoryLabel(a.category))}</category>
      <author>${esc(a.author_name)}</author>${image ? `\n      <enclosure url="${esc(image)}" type="image/jpeg" length="0"/>` : ''}
    </item>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(SITE_NAME)}</title>
    <link>${base}</link>
    <description>${esc(SITE_DESCRIPTION)}</description>
    <language>en-ke</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${base}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=600, s-maxage=600',
    },
  })
}
