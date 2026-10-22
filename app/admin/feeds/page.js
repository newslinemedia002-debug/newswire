import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import FeedsPanel from '@/components/admin/FeedsPanel'
import styles from '@/app/admin/admin.module.css'

export const metadata = { title: 'RSS feeds' }

export default async function AdminFeedsPage({ searchParams }) {
  await requireAdmin('/admin/feeds')
  const sp = await searchParams
  const adminCli = createAdminClient()

  const { data = [] } = await adminCli
    .from('feed_sources')
    .select('id, name, url, region, enabled')
    .order('region')
    .order('name')

  const errorMsg = sp?.error ? String(sp.error).slice(0, 300) : null
  const okMsg = sp?.ok ? String(sp.ok).slice(0, 300) : null

  return (
    <>
      <h1 className={styles.title}>RSS feeds</h1>
      <p className={styles.sub}>
        These sources feed the “Kenyan headlines” and “World headlines” wires on the front page.
        Disabled sources are skipped everywhere.
      </p>

      {errorMsg && <div className="alert alertError" role="alert">{errorMsg}</div>}
      {okMsg && <div className="alert alertSuccess" role="status">{okMsg}</div>}

      <FeedsPanel feeds={data} />
    </>
  )
}
