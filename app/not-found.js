import Link from 'next/link'
import { SITE_NAME } from '@/lib/site'

export const metadata = { title: 'Page not found' }

export default function NotFound() {
  return (
    <div className="container" style={{ paddingTop: 64, paddingBottom: 80, textAlign: 'center' }}>
      <p style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--brand)' }}>
        404
      </p>
      <h1
        style={{
          fontFamily: 'var(--serif)',
          fontSize: 'clamp(30px, 5vw, 46px)',
          margin: '8px 0 12px',
          color: 'var(--black)',
        }}
      >
        This story has moved or never existed
      </h1>
      <p style={{ color: 'var(--muted)', maxWidth: 480, margin: '0 auto 26px' }}>
        The link may be out of date. Browse the latest from {SITE_NAME}, or search for what you
        were looking for.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link href="/" className="btn">Back to the front page</Link>
        <Link href="/search" className="btn btnGhost">Search stories</Link>
      </div>
    </div>
  )
}
