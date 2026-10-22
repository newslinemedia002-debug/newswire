/** Article queries + slug helpers. All take a Supabase client (RLS applies). */

export function slugify(text) {
  return (
    String(text || '')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 80) || 'article'
  )
}

export async function uniqueSlug(client, base, excludeId = null) {
  const stem = slugify(base)
  let candidate = stem
  for (let i = 2; i < 50; i++) {
    let q = client.from('articles').select('id').eq('slug', candidate).limit(1)
    if (excludeId) q = q.neq('id', excludeId)
    const { data } = await q
    if (!data || data.length === 0) return candidate
    candidate = `${stem}-${i}`
  }
  return `${stem}-${Date.now()}`
}

export const LIST_FIELDS =
  'id, title, slug, excerpt, cover_image_url, category, author_name, published_at, created_at, updated_at, views, is_featured, is_breaking, status, author_id'

export async function getFeatured(client) {
  const { data } = await client
    .from('articles')
    .select(LIST_FIELDS)
    .eq('status', 'published')
    .order('is_featured', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(1)
  return data?.[0] || null
}

export async function getBreaking(client) {
  const { data } = await client
    .from('articles')
    .select(LIST_FIELDS)
    .eq('status', 'published')
    .eq('is_breaking', true)
    .order('published_at', { ascending: false })
    .limit(1)
  return data?.[0] || null
}

export async function getLatest(client, { limit = 6, exclude = [], category = null } = {}) {
  let q = client
    .from('articles')
    .select(LIST_FIELDS)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit + exclude.length)
  if (category) q = q.eq('category', category)
  const { data } = await q
  const excluded = new Set(exclude)
  return (data || []).filter((a) => !excluded.has(a.id)).slice(0, limit)
}

export async function getByCategory(client, category, { limit = 12 } = {}) {
  const { data } = await client
    .from('articles')
    .select(LIST_FIELDS)
    .eq('status', 'published')
    .eq('category', category)
    .order('published_at', { ascending: false })
    .limit(limit)
  return data || []
}

export async function getMostRead(client, { limit = 5 } = {}) {
  const { data } = await client
    .from('articles')
    .select(LIST_FIELDS)
    .eq('status', 'published')
    .order('views', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(limit)
  return data || []
}

export async function getArticleBySlug(client, slug) {
  const { data } = await client
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()
  return data || null
}

export async function searchArticles(client, q, { limit = 20 } = {}) {
  const term = `%${String(q).replace(/[%_,()]/g, ' ').trim()}%`
  const { data } = await client
    .from('articles')
    .select(LIST_FIELDS)
    .eq('status', 'published')
    .or(`title.ilike.${term},excerpt.ilike.${term},content.ilike.${term}`)
    .order('published_at', { ascending: false })
    .limit(limit)
  return data || []
}
