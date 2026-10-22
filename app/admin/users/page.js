import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import UsersPanel from '@/components/admin/UsersPanel'
import styles from '@/app/admin/admin.module.css'

export const metadata = { title: 'Manage users' }

export default async function AdminUsersPage({ searchParams }) {
  const { profile } = await requireAdmin('/admin/users')
  const sp = await searchParams
  const adminCli = createAdminClient()

  const [usersRes, profilesRes] = await Promise.all([
    adminCli.auth.admin.listUsers({ perPage: 1000 }),
    adminCli.from('profiles').select('id, full_name, role, email, created_at'),
  ])

  const profiles = new Map((profilesRes.data || []).map((p) => [p.id, p]))
  const users = (usersRes.data?.users || [])
    .map((u) => {
      const p = profiles.get(u.id)
      return {
        id: u.id,
        email: u.email,
        full_name: p?.full_name || u.user_metadata?.full_name || '',
        role: p?.role || 'author',
        created_at: p?.created_at || u.created_at,
      }
    })
    .sort((a, b) => a.email.localeCompare(b.email))

  const errorMsg = sp?.error ? String(sp.error).slice(0, 300) : null
  const okMsg = sp?.ok ? String(sp.ok).slice(0, 300) : null

  return (
    <>
      <h1 className={styles.title}>Users</h1>
      <p className={styles.sub}>
        Only admins can add people to Newswire. Authors write; admins also publish and moderate.
      </p>

      {errorMsg && <div className="alert alertError" role="alert">{errorMsg}</div>}
      {okMsg && <div className="alert alertSuccess" role="status">{okMsg}</div>}

      <UsersPanel users={users} currentUserId={profile.id} />
    </>
  )
}
