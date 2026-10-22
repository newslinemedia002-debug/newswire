import { siteUrl } from '@/lib/site'

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/dashboard', '/api/'],
      },
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
  }
}
