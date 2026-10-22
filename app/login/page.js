import { Suspense } from 'react'
import LoginForm from '@/components/LoginForm'
import { SITE_NAME } from '@/lib/site'
import styles from './login.module.css'

export const metadata = {
  title: 'Sign in',
  description: `Sign in to ${SITE_NAME} to write, edit and publish stories.`,
}

export default async function LoginPage({ searchParams }) {
  const sp = await searchParams
  const next = typeof sp?.next === 'string' ? sp.next : '/dashboard'

  return (
    <div className={`container ${styles.wrap}`}>
      <div className={styles.card}>
        <span className={styles.logoBlock} aria-hidden="true">N</span>
        <h1>Sign in to {SITE_NAME}</h1>
        <p className={styles.sub}>
          Accounts are created by administrators. Ask yours for your login details.
        </p>
        <Suspense fallback={null}>
          <LoginForm next={next} />
        </Suspense>
      </div>
    </div>
  )
}
