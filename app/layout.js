import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { SITE_NAME, SITE_DESCRIPTION, siteUrl } from '@/lib/site'

export const metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${SITE_NAME} — Breaking news from Kenya and the world`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    siteName: SITE_NAME,
    type: 'website',
    locale: 'en_KE',
    url: '/',
  },
  twitter: { card: 'summary_large_image' },
}

export const viewport = {
  themeColor: '#bb1919',
}

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'NewsMediaOrganization',
  name: SITE_NAME,
  url: siteUrl(),
  logo: `${siteUrl}/icon.svg`,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en-KE">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
