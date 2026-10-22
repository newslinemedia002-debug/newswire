'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES } from '@/lib/site'
import styles from './Header.module.css'

const SECTIONS = [{ slug: 'home', label: 'Home', href: '/' }, ...CATEGORIES.map((c) => ({ slug: c.slug, label: c.label, href: `/section/${c.slug}` }))]

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [profile, setProfile] = useState(null) // null = loading, false = signed out
  const [menuOpen, setMenuOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const userRef = useRef(null)

  useEffect(() => {
    const supabase = createClient()
    let active = true

    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!active) return
        if (!user) { setProfile(false); return }
        const { data } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).maybeSingle()
        if (!active) return
        setProfile(data ? { full_name: data.full_name, role: data.role } : { full_name: user.email, role: 'author' })
      } catch {
        // network hiccup: fall back to the signed-out UI rather than spinning forever
        if (active) setProfile(false)
      }
    }
    load()

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') setProfile(false)
      if (event === 'SIGNED_IN') load()
    })
    return () => { active = false; sub.subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    function onDocClick(e) {
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  function closeMenus() {
    setMenuOpen(false)
    setUserOpen(false)
  }

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut({ scope: 'local' })
    setProfile(false)
    router.push('/login')
    router.refresh()
  }

  const firstName = profile ? (profile.full_name || '').split(' ')[0] || 'Account' : ''

  return (
    <header className={styles.header}>
      <div className={styles.bar}>
        <div className={styles.left}>
          <button
            type="button"
            className={styles.iconBtn}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <svg width="22" height="16" viewBox="0 0 22 16" aria-hidden="true">
              <rect width="22" height="2.6" rx="1.3" fill="currentColor" />
              <rect y="6.7" width="22" height="2.6" rx="1.3" fill="currentColor" />
              <rect y="13.4" width="22" height="2.6" rx="1.3" fill="currentColor" />
            </svg>
          </button>
          <Link href="/search" className={styles.iconBtn} aria-label="Search">
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
              <circle cx="8.5" cy="8.5" r="6" fill="none" stroke="currentColor" strokeWidth="2.4" />
              <line x1="13.2" y1="13.2" x2="18.4" y2="18.4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
          </Link>
        </div>

        <Link href="/" className={styles.logo} aria-label="Newswire home">
          <span className={styles.logoBlock}>N</span>
          <span className={styles.logoWord}>Newswire</span>
        </Link>

        <div className={styles.auth}>
          {profile === null ? (
            <span className={styles.authLoading} aria-hidden="true" />
          ) : profile === false ? (
            <Link href="/login" className={`${styles.signBtn}`}>Sign in</Link>
          ) : (
            <div className={styles.userWrap} ref={userRef}>
              <button
                type="button"
                className={styles.userBtn}
                aria-expanded={userOpen}
                onClick={() => setUserOpen((v) => !v)}
              >
                <span className={styles.avatar}>{firstName.charAt(0).toUpperCase()}</span>
                <span className={styles.userName}>{firstName}</span>
                <svg width="10" height="6" viewBox="0 0 10 6" aria-hidden="true"><path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
              </button>
              {userOpen && (
                <div className={styles.userMenu}>
                  <div className={styles.userMenuHead}>
                    <strong>{profile.full_name || 'Your account'}</strong>
                  </div>
                  <Link href="/dashboard" onClick={closeMenus}>Dashboard</Link>
                  {profile.role === 'admin' && <Link href="/admin" onClick={closeMenus}>Admin panel</Link>}
                  <Link href="/dashboard/settings" onClick={closeMenus}>Settings</Link>
                  <button type="button" onClick={signOut}>Sign out</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <nav className={styles.nav} aria-label="Sections">
        <div className={styles.navInner}>
          {SECTIONS.map((s) => {
            const active = s.href === '/' ? pathname === '/' : pathname.startsWith(s.href)
            return (
              <Link key={s.slug} href={s.href} className={active ? styles.navActive : undefined}>
                {s.label}
              </Link>
            )
          })}
        </div>
      </nav>

      {menuOpen && (
        <div className={styles.mobileMenu}>
          {SECTIONS.map((s) => (
            <Link key={s.slug} href={s.href} onClick={closeMenus}>{s.label}</Link>
          ))}
          <Link href="/search" onClick={closeMenus}>Search</Link>
          <Link href="/dashboard" onClick={closeMenus}>Dashboard</Link>
          {profile?.role === 'admin' && <Link href="/admin" onClick={closeMenus}>Admin panel</Link>}
        </div>
      )}
    </header>
  )
}
