import { requireUser } from '@/lib/auth'
import { PasswordForm, NameForm } from '@/components/SettingsForms'
import styles from '@/app/dashboard/dashboard.module.css'
import local from './settings.module.css'

export const metadata = { title: 'Settings' }
export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const { user, profile } = await requireUser('/dashboard/settings')

  return (
    <div className={`container ${styles.page}`}>
      <div className={styles.head}>
        <div>
          <h1 className={styles.title}>Settings</h1>
          <p className={styles.sub}>
            Signed in as <strong>{profile.email}</strong> · role: <strong>{profile.role}</strong>
          </p>
        </div>
      </div>

      <div className={local.grid}>
        <section className={local.card}>
          <h2>Profile</h2>
          <p className={local.hint}>Your name appears under every story you publish.</p>
          <NameForm initialName={profile.full_name} />
        </section>

        <section className={local.card}>
          <h2>Password</h2>
          <p className={local.hint}>
            Use a strong, unique password — at least 12 characters recommended.
          </p>
          <PasswordForm />
        </section>

        <section className={local.card}>
          <h2>Account</h2>
          <p className={local.hint}>
            User ID <code style={{ fontSize: 12, overflowWrap: 'anywhere' }}>{user.id}</code>
          </p>
          <p className={local.hint}>
            Need your role or email changed? Only administrators can do that — contact your admin.
          </p>
        </section>
      </div>
    </div>
  )
}
