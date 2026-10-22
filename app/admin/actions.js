'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'

function go(path, params = {}) {
  const qs = new URLSearchParams(params).toString()
  revalidatePath('/', 'layout')
  redirect(qs ? `${path}?${qs}` : path)
}

function validRole(role) {
  return role === 'admin' || role === 'author' ? role : 'author'
}

// ---------- user management (admins only) ----------

export async function createUser(prevState, formData) {
  const { profile } = await requireAdmin('/admin/users')
  const email = String(formData.get('email') || '').trim().toLowerCase()
  const password = String(formData.get('password') || '')
  const fullName = String(formData.get('full_name') || '').trim().slice(0, 80)
  const role = validRole(formData.get('role'))

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Enter a valid email address.' }
  if (password.length < 6) return { error: 'Password must be at least 6 characters.' }
  if (!fullName) return { error: 'Enter the user’s full name.' }
  if (role === 'admin' && profile.role !== 'admin') return { error: 'Only admins can create admins.' }

  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })
  if (error) return { error: `Could not create user: ${error.message}` }

  const { error: profErr } = await admin
    .from('profiles')
    .update({ role, full_name: fullName, email })
    .eq('id', data.user.id)
  if (profErr) return { error: `User created but role failed: ${profErr.message}` }

  revalidatePath('/admin/users')
  return { success: `${email} created as ${role}.` }
}

export async function setUserRole(formData) {
  await requireAdmin('/admin/users')
  const id = String(formData.get('id') || '')
  const role = validRole(formData.get('role'))
  const admin = createAdminClient()
  const { error } = await admin.from('profiles').update({ role }).eq('id', id)
  if (error) go('/admin/users', { error: error.message })
  go('/admin/users', { ok: 'Role updated.' })
}

export async function resetUserPassword(prevState, formData) {
  await requireAdmin('/admin/users')
  const id = String(formData.get('id') || '')
  const password = String(formData.get('password') || '')
  if (password.length < 6) return { error: 'Password must be at least 6 characters.' }
  const admin = createAdminClient()
  const { error } = await admin.auth.admin.updateUserById(id, { password, email_confirm: true })
  if (error) return { error: `Could not reset password: ${error.message}` }
  return { success: 'Password reset.' }
}

export async function deleteUser(formData) {
  const { profile } = await requireAdmin('/admin/users')
  const id = String(formData.get('id') || '')
  if (id === profile.id) go('/admin/users', { error: 'You cannot delete your own account.' })
  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(id)
  if (error) go('/admin/users', { error: error.message })
  go('/admin/users', { ok: 'User deleted.' })
}

// ---------- article moderation (admins only) ----------

export async function moderateArticle(formData) {
  await requireAdmin('/admin/articles')
  const id = String(formData.get('id') || '')
  const op = String(formData.get('op') || '')
  const admin = createAdminClient()

  if (op === 'delete') {
    const { error } = await admin.from('articles').delete().eq('id', id)
    go('/admin/articles', error ? { error: error.message } : { ok: 'Article deleted.' })
  }

  if (op === 'publish' || op === 'unpublish') {
    const patch =
      op === 'publish'
        ? { status: 'published', published_at: new Date().toISOString() }
        : { status: 'draft' }
    const { error } = await admin.from('articles').update(patch).eq('id', id)
    go('/admin/articles', error ? { error: error.message } : { ok: `Article ${op}ed.` })
  }

  if (op === 'feature' || op === 'unfeature') {
    if (op === 'feature') {
      // only one lead story at a time
      await admin.from('articles').update({ is_featured: false }).neq('id', id)
    }
    const { error } = await admin
      .from('articles')
      .update({ is_featured: op === 'feature' })
      .eq('id', id)
    go('/admin/articles', error ? { error: error.message } : { ok: 'Homepage lead story updated.' })
  }

  if (op === 'break' || op === 'unbreak') {
    if (op === 'break') {
      await admin.from('articles').update({ is_breaking: false }).neq('id', id)
    }
    const { error } = await admin
      .from('articles')
      .update({ is_breaking: op === 'break' })
      .eq('id', id)
    go('/admin/articles', error ? { error: error.message } : { ok: 'Breaking flag updated.' })
  }

  if (op === 'reject') {
    const { error } = await admin.from('articles').update({ status: 'rejected' }).eq('id', id)
    go('/admin/articles', error ? { error: error.message } : { ok: 'Article rejected.' })
  }

  go('/admin/articles')
}

// ---------- RSS feed sources (admins only) ----------

export async function saveFeedSource(prevState, formData) {
  await requireAdmin('/admin/feeds')
  const id = String(formData.get('id') || '').trim()
  const name = String(formData.get('name') || '').trim()
  const url = String(formData.get('url') || '').trim()
  const region = formData.get('region') === 'kenya' ? 'kenya' : 'world'

  if (!name) return { error: 'Give the feed a name.' }
  if (!/^https?:\/\/\S+$/i.test(url)) return { error: 'Enter a valid http(s) feed URL.' }

  const admin = createAdminClient()
  if (id) {
    const { error } = await admin
      .from('feed_sources')
      .update({ name, url, region })
      .eq('id', id)
    if (error) return { error: `Could not update feed: ${error.message}` }
    return { success: 'Feed updated.' }
  }
  const { error } = await admin.from('feed_sources').insert({ name, url, region })
  if (error) return { error: `Could not add feed: ${error.message}` }
  return { success: 'Feed added.' }
}

export async function deleteFeedSource(formData) {
  await requireAdmin('/admin/feeds')
  const id = String(formData.get('id') || '')
  const admin = createAdminClient()
  const { error } = await admin.from('feed_sources').delete().eq('id', id)
  go('/admin/feeds', error ? { error: error.message } : { ok: 'Feed removed.' })
}

export async function toggleFeedSource(formData) {
  await requireAdmin('/admin/feeds')
  const id = String(formData.get('id') || '')
  const enabled = formData.get('enabled') === 'true'
  const admin = createAdminClient()
  const { error } = await admin.from('feed_sources').update({ enabled: !enabled }).eq('id', id)
  go('/admin/feeds', error ? { error: error.message } : { ok: 'Feed updated.' })
}
