import { requireAdmin } from '@/lib/auth'
import AdminShell from '@/components/AdminShell'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }) {
  await requireAdmin('/admin')
  return <AdminShell>{children}</AdminShell>
}
