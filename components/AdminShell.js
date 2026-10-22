'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from '@/app/admin/admin.module.css'

const LINKS = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/articles', label: 'Articles' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/feeds', label: 'RSS feeds' },
]

export default function AdminShell({ children }) {
  const pathname = usePathname()

  return (
    <div className={`container ${styles.wrap}`}>
      <nav className={styles.side} aria-label="Admin sections">
        <span className={styles.sideTitle}>Admin panel</span>
        {LINKS.map((l) => {
          const active = l.href === '/admin' ? pathname === '/admin' : pathname.startsWith(l.href)
          return (
            <Link key={l.href} href={l.href} className={active ? styles.active : undefined}>
              {l.label}
            </Link>
          )
        })}
      </nav>
      <div>{children}</div>
    </div>
  )
}
