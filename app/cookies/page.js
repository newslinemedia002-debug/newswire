import Link from 'next/link'
import { SITE_NAME } from '@/lib/site'
import styles from '@/app/legal/legal.module.css'

export const metadata = {
  title: 'Cookies Policy',
  description: `How ${SITE_NAME} uses cookies.`,
}

export default function CookiesPage() {
  return (
    <div className={`container ${styles.wrap}`}>
      <article className={styles.doc}>
        <h1>Cookies Policy</h1>
        <p className={styles.updated}>
          Last updated: {new Date().getFullYear()} · Applies to all of {SITE_NAME}
        </p>

        <section>
          <h2>What cookies are</h2>
          <p>
            Cookies are small text files a website stores on your device to remember information
            between page loads.
          </p>
        </section>

        <section>
          <h2>Cookies {SITE_NAME} uses</h2>
          <p>
            {SITE_NAME} keeps cookie usage to the minimum needed to run the service:
          </p>
          <ul>
            <li>
              <strong>Session cookie</strong> — when you sign in, an authentication cookie (named{' '}
              <code>sb-…-auth-token</code>) is stored so you stay signed in as you move between
              pages. Signing out removes it.
            </li>
            <li>
              <strong>Preference echo</strong> — none. We do not store colour, layout or language
              preferences in cookies.
            </li>
          </ul>
        </section>

        <section>
          <h2>What we do not use</h2>
          <ul>
            <li>No advertising or retargeting cookies.</li>
            <li>No third-party analytics or social-media tracking pixels.</li>
            <li>No cross-site profiling of readers.</li>
          </ul>
        </section>

        <section>
          <h2>Managing cookies</h2>
          <p>
            You can clear or block cookies in your browser settings at any time. Blocking the
            session cookie simply means you will need to sign in again to access your dashboard or
            admin panel; reading published news does not require cookies at all.
          </p>
        </section>

        <section>
          <h2>Questions</h2>
          <p>
            For anything else about how {SITE_NAME} handles data, see our{' '}
            <Link href="/terms">Terms &amp; Policy</Link> or contact the site administrators.
          </p>
        </section>

        <p style={{ marginTop: 28 }}>
          <Link href="/" className="btn btnGhost">← Back to the front page</Link>
        </p>
      </article>
    </div>
  )
}
