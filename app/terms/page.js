import Link from 'next/link'
import { SITE_NAME } from '@/lib/site'
import styles from '@/app/legal/legal.module.css'

export const metadata = {
  title: 'Terms & Policy',
  description: `Terms of use and content policy for ${SITE_NAME}.`,
}

export default function TermsPage() {
  return (
    <div className={`container ${styles.wrap}`}>
      <article className={styles.doc}>
        <h1>Terms &amp; Policy</h1>
        <p className={styles.updated}>
          Last updated: {new Date().getFullYear()} · Effective for all pages of {SITE_NAME}
        </p>

        <section>
          <h2>1. Acceptance of these terms</h2>
          <p>
            By accessing {SITE_NAME} you agree to these terms and to our{' '}
            <Link href="/cookies">Cookies Policy</Link>. If you do not agree, please do not use the
            site.
          </p>
        </section>

        <section>
          <h2>2. What {SITE_NAME} is</h2>
          <p>
            {SITE_NAME} is a news reading and publishing platform. It combines stories written and
            published by approved contributors on this site with headlines aggregated from public
            RSS feeds operated by third-party publishers.
          </p>
        </section>

        <section>
          <h2>3. Accounts</h2>
          <p>
            Accounts are created by administrators only — there is no open registration. You are
            responsible for keeping your credentials confidential and for all activity under your
            account. Administrators may create, modify or remove accounts and articles to operate
            the newsroom.
          </p>
        </section>

        <section>
          <h2>4. Contributor content</h2>
          <p>
            Contributors retain ownership of the articles they write. By submitting an article you
            grant {SITE_NAME} a non-exclusive licence to publish, edit, promote and archive it on
            the site and in our feeds. Every story must be original to you or properly licensed, and
            must include a cover image.
          </p>
        </section>

        <section>
          <h2>5. Aggregated headlines and attribution</h2>
          <p>
            Wire stories shown under “Kenyan headlines” and “World headlines” are sourced from
            public RSS feeds. {SITE_NAME} displays the headline, summary and image supplied by the
            publisher, credits the original source on every story, and links to the original
            article. Rights in those stories remain with their publishers. If you are a publisher
            and want an item removed or a feed unlisted, contact us and we will act promptly.
          </p>
        </section>

        <section>
          <h2>6. Acceptable use</h2>
          <p>
            You must not post unlawful, defamatory, plagiarised or infringing content; attempt to
            gain access to other accounts or administrative areas; overload or probe the service;
            or use {SITE_NAME} to distribute malware or spam.
          </p>
        </section>

        <section>
          <h2>7. Editorial discretion</h2>
          <p>
            Articles may be edited for clarity, length, accuracy and house style. Admins may
            publish, unpublish, feature or remove any article to keep the front page accurate and
            safe.
          </p>
        </section>

        <section>
          <h2>8. Disclaimer and limitation of liability</h2>
          <p>
            The site is provided “as is”. While we aim for accuracy, {SITE_NAME} does not warrant
            that every story is complete, current or error-free. To the extent permitted by law,
            {SITE_NAME} is not liable for losses arising from reliance on site content or from
            interruptions of the service.
          </p>
        </section>

        <section>
          <h2>9. Changes and contact</h2>
          <p>
            We may update these terms; the date above shows the latest revision. Questions about
            these terms, attribution or data requests can be sent through the newsroom administrators
            of {SITE_NAME}.
          </p>
        </section>

        <p style={{ marginTop: 28 }}>
          <Link href="/" className="btn btnGhost">← Back to the front page</Link>
        </p>
      </article>
    </div>
  )
}
