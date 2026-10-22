import Link from 'next/link'
import { CATEGORIES, SITE_NAME } from '@/lib/site'
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.logo} aria-label={`${SITE_NAME} home`}>
          <span className={styles.logoBlock}>N</span>
          <span className={styles.logoWord}>{SITE_NAME}</span>
        </Link>

        <nav className={styles.cols} aria-label="Footer">
          <div>
            <h3>Sections</h3>
            {CATEGORIES.map((c) => (
              <Link key={c.slug} href={`/section/${c.slug}`}>{c.label}</Link>
            ))}
          </div>
          <div>
            <h3>{SITE_NAME}</h3>
            <Link href="/search">Search</Link>
            <Link href="/login">Sign in</Link>
            <Link href="/feed.xml">News RSS feed</Link>
          </div>
          <div>
            <h3>For newsrooms</h3>
            <Link href="/dashboard">Contributor dashboard</Link>
            <Link href="/dashboard/articles/new">Publish a story</Link>
          </div>
          <div>
            <h3>Legal</h3>
            <Link href="/terms">Terms &amp; policy</Link>
            <Link href="/cookies">Cookies policy</Link>
          </div>
        </nav>
      </div>
      <div className={styles.bottom}>
        <div className="container">
          <p>
            © {new Date().getFullYear()} {SITE_NAME}. Aggregated headlines link to their original
            publishers. All rights belong to the respective authors and outlets.
          </p>
        </div>
      </div>
    </footer>
  )
}
