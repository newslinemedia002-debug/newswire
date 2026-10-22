export const SITE_NAME = 'Newswire'
export const SITE_TAGLINE = 'Breaking news from Kenya and around the world'
export const SITE_DESCRIPTION =
  'Newswire brings you breaking news and in-depth coverage from Kenya, Africa and around the world — politics, business, technology, entertainment and more.'

export const CATEGORIES = [
  { slug: 'kenya', label: 'Kenya' },
  { slug: 'world', label: 'World' },
  { slug: 'africa', label: 'Africa' },
  { slug: 'business', label: 'Business' },
  { slug: 'tech', label: 'Technology' },
  { slug: 'entertainment', label: 'Entertainment' },
]

export function categoryLabel(slug) {
  return CATEGORIES.find((c) => c.slug === slug)?.label || 'News'
}

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '')
}

export function absUrl(src) {
  if (!src) return null
  if (/^https?:\/\//i.test(src)) return src
  return siteUrl() + (src.startsWith('/') ? src : '/' + src)
}

export function formatDate(iso) {
  if (!iso) return ''
  return new Intl.DateTimeFormat('en-KE', {
    dateStyle: 'long',
    timeZone: 'Africa/Nairobi',
  }).format(new Date(iso))
}

export function relativeTime(iso) {
  if (!iso) return ''
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) {
    const m = Math.floor(diff / 60)
    return `${m} min ago`
  }
  if (diff < 86400) {
    const h = Math.floor(diff / 3600)
    return h === 1 ? '1 hr ago' : `${h} hrs ago`
  }
  if (diff < 86400 * 7) {
    const d = Math.floor(diff / 86400)
    return d === 1 ? '1 day ago' : `${d} days ago`
  }
  return formatDate(iso)
}
