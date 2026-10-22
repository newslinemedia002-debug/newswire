import Parser from 'rss-parser'
import { createHash } from 'node:crypto'

const parser = new Parser({
  timeout: 25000,
  headers: {
    'User-Agent': 'NewswireBot/1.0 (+https://newswire.example)',
    Accept: 'application/rss+xml, application/xml, text/xml, */*',
  },
})

/** Enabled sources for a region ('kenya' | 'world'). Reads feed_sources (service role). */
export async function getFeedSources(admin, region = null) {
  let q = admin.from('feed_sources').select('id, name, url, region, enabled').eq('enabled', true)
  if (region) q = q.eq('region', region)
  const { data, error } = await q.order('name')
  if (error) throw new Error(`feed_sources: ${error.message}`)
  return data || []
}

function rssImage(item) {
  if (item.enclosure?.url) return item.enclosure.url
  const media = item['media:content'] || item['media:thumbnail']
  if (media) {
    if (typeof media === 'string' && /^https?:/.test(media)) return media
    if (media.$?.url) return media.$.url
    if (media.url) return media.url
  }
  const html = item['content:encoded'] || item.content || ''
  const m = String(html).match(/<img[^>]+src=["']([^"']+)["']/i)
  return m ? m[1] : null
}

function stripHtml(html) {
  return String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Keeps paragraph breaks from feed HTML so the reader page shows real paragraphs. */
function stripHtmlKeepLines(html) {
  return String(html || '')
    .replace(/<\/p>|<br\s*\/?>|<\/div>|<\/h[1-6]>/gi, '\n\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n\n')
    .slice(0, 6000)
}

export function excerptOf(text, max = 190) {
  const s = stripHtml(text)
  if (s.length <= max) return s
  return s.slice(0, max).replace(/\s+\S*$/, '') + '…'
}

function wireKey(link) {
  return createHash('sha1').update(String(link)).digest('hex')
}

/**
 * Many RSS feeds (BBC, Nation, Standard, Al Jazeera, KBC, Google News…) ship
 * no images. Read the story page's og:image so every wire story can carry one.
 */
async function resolveOgImage(url) {
  try {
    const ctl = new AbortController()
    const timer = setTimeout(() => ctl.abort(), 12000)
    const res = await fetch(url, {
      signal: ctl.signal,
      // Publisher CDNs and news.google.com reject bot-like UAs with a 403;
      // a normal browser UA is what these public article pages expect.
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
      },
      redirect: 'follow',
    })
    clearTimeout(timer)
    if (!res.ok) return null
    // Some publishers (news.google.com) ship ~600KB pages where the meta
    // tags sit past the first 300KB, so scan the full document.
    const html = await res.text()
    const m =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
      html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
    return m ? m[1].trim() : null
  } catch {
    return null
  }
}

async function mapWithConcurrency(items, limit, fn) {
  const out = new Array(items.length)
  let next = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++
      out[i] = await fn(items[i], i)
    }
  })
  await Promise.all(workers)
  return out
}

/**
 * Parse every enabled source of a region (best effort per source), then make
 * sure each candidate story has an image: reuse the cached wire image first,
 * otherwise resolve the original article's og:image. Items that end up with
 * no image are dropped (site rule: wire stories always show a picture).
 */
export async function fetchRegionFeed(admin, region, { limit = 14 } = {}) {
  const sources = await getFeedSources(admin, region)
  const results = await Promise.allSettled(
    sources.map(async (s) => {
      const feed = await parser.parseURL(s.url)
      return (feed.items || []).slice(0, limit * 2).map((item) => ({
        uniqueKey: wireKey(item.link || item.guid || s.url),
        title: stripHtml(item.title || '').slice(0, 220),
        link: item.link || item.guid || s.url,
        image: rssImage(item),
        excerpt: excerptOf(item.contentSnippet || item.content || item.summary || ''),
        body: stripHtmlKeepLines(
          item['content:encoded'] || item.content || item.contentSnippet || ''
        ),
        source: s.name,
        publishedAt: item.isoDate || item.pubDate || null,
      }))
    })
  )

  // Interleave sources round-robin (newest first inside each source) so a
  // high-volume provider can't crowd every other one out of the window.
  const bySource = results
    .filter((r) => r.status === 'fulfilled')
    .map((r) =>
      r.value
        .filter((i) => i.title && i.link)
        .sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))
    )
  const candidates = []
  for (let i = 0; candidates.length < limit * 2; i++) {
    let added = false
    for (const list of bySource) {
      if (candidates.length >= limit * 2) break
      const item = list[i]
      if (item) {
        candidates.push(item)
        added = true
      }
    }
    if (!added) break
  }

  // 1) reuse images already stored for these stories
  const keyToImage = await cachedImages(admin, candidates.map((c) => c.uniqueKey))
  for (const c of candidates) {
    if (!c.image && keyToImage.get(c.uniqueKey)) c.image = keyToImage.get(c.uniqueKey)
  }

  // 2) resolve the rest from the original article pages (bounded concurrency)
  const missing = candidates.filter((c) => !c.image)
  await mapWithConcurrency(missing, 6, async (c) => {
    c.image = await resolveOgImage(c.link)
    return null
  })

  return candidates.filter((c) => c.image).slice(0, limit)
}

async function cachedImages(admin, keys) {
  const map = new Map()
  if (!keys.length) return map
  const { data } = await admin
    .from('wire_items')
    .select('unique_key, image_url')
    .in('unique_key', keys.slice(0, 100))
    .not('image_url', 'is', null)
  for (const row of data || []) map.set(row.unique_key, row.image_url)
  return map
}

/** Persist fetched wire items so they can be read on Newswire with attribution. */
export async function storeWireItems(admin, region, items) {
  if (!items.length) return
  const rows = items.map((i) => ({
    unique_key: i.uniqueKey,
    region,
    source: i.source,
    title: i.title,
    excerpt: i.excerpt,
    body: i.body,
    image_url: i.image,
    external_url: i.link,
    published_at: i.publishedAt || new Date().toISOString(),
    fetched_at: new Date().toISOString(),
  }))
  await admin.from('wire_items').upsert(rows, { onConflict: 'unique_key' })
  // keep the cache lean
  await admin
    .from('wire_items')
    .delete()
    .eq('region', region)
    .lt('fetched_at', new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString())
}

/**
 * Cached wire items for on-site reading (anon-readable via RLS), interleaved
 * round-robin by source so every provider appears, not just the fastest one.
 */
export async function getWireItems(admin, region, { limit = 8 } = {}) {
  const { data, error } = await admin
    .from('wire_items')
    .select('id, source, title, excerpt, image_url, external_url, published_at, region')
    .eq('region', region)
    .not('image_url', 'is', null)
    .order('published_at', { ascending: false })
    .limit(Math.max(40, limit * 6))
  if (error) throw new Error(`wire_items: ${error.message}`)

  const rows = data || []
  const bySource = new Map()
  for (const row of rows) {
    if (!bySource.has(row.source)) bySource.set(row.source, [])
    bySource.get(row.source).push(row)
  }
  const queues = [...bySource.values()]
  const out = []
  for (let i = 0; out.length < limit && queues.some((q) => q.length); i++) {
    for (const q of queues) {
      if (out.length >= limit) break
      const item = q.shift()
      if (item) out.push(item)
    }
    if (i > 200) break
  }
  return out
}

/**
 * One call for pages: refresh the cache from the live feeds (best effort),
 * then read back what is stored — so the section still renders if a feed
 * is temporarily unreachable.
 */
export async function loadWire(admin, region, { limit = 8 } = {}) {
  try {
    const fresh = await fetchRegionFeed(admin, region, { limit })
    await storeWireItems(admin, region, fresh)
  } catch {
    // fall through to whatever is cached
  }
  try {
    return await getWireItems(admin, region, { limit })
  } catch {
    return []
  }
}
