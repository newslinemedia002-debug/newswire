'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { uniqueSlug } from '@/lib/articles'

const CATEGORIES = ['kenya', 'world', 'africa', 'business', 'tech', 'entertainment']

function isRedirect(e) {
  return Boolean(e && typeof e.digest === 'string' && e.digest.startsWith('NEXT_REDIRECT'))
}

async function uploadCover(file) {
  if (!file || typeof file === 'string' || file.size === 0) return null
  if (!file.type || !file.type.startsWith('image/')) {
    throw new Error('Cover must be an image file (jpg, png, webp).')
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Cover image must be smaller than 5 MB.')
  }
  const ext = (file.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg')
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const buf = Buffer.from(await file.arrayBuffer())
  const admin = createAdminClient()
  const { error } = await admin.storage
    .from('covers')
    .upload(name, buf, { contentType: file.type, upsert: false })
  if (error) throw new Error(`Image upload failed: ${error.message}`)
  return admin.storage.from('covers').getPublicUrl(name).data.publicUrl
}

function readArticleFields(formData) {
  const title = String(formData.get('title') || '').trim()
  const excerpt = String(formData.get('excerpt') || '').trim().slice(0, 400)
  const content = String(formData.get('content') || '').trim()
  const rawCat = String(formData.get('category') || 'world')
  const category = CATEGORIES.includes(rawCat) ? rawCat : 'world'
  const intent = String(formData.get('intent') || 'draft') === 'pending' ? 'pending' : 'draft'
  return { title, excerpt, content, category, intent }
}

export async function createArticle(prevState, formData) {
  const { supabase, user } = await requireUser('/dashboard')
  const { title, excerpt, content, category, intent } = readArticleFields(formData)

  if (!title) return { error: 'Give the article a headline.' }
  if (title.length > 180) return { error: 'Headline is too long (max 180 characters).' }
  if (!content) return { error: 'Write the article body before saving.' }

  let cover = null
  try {
    cover = await uploadCover(formData.get('cover'))
  } catch (e) {
    return { error: e.message }
  }
  const coverUrl = String(formData.get('cover_url') || '').trim() || cover
  if (!coverUrl) {
    return { error: 'Every story needs a cover image — upload one or paste an image URL.' }
  }

  const slug = await uniqueSlug(supabase, title)
  const { error } = await supabase.from('articles').insert({
    author_id: user.id,
    title,
    slug,
    excerpt: excerpt || content.replace(/\s+/g, ' ').slice(0, 180),
    content,
    cover_image_url: coverUrl || null,
    category,
    status: intent,
  })
  if (error) return { error: `Could not save article: ${error.message}` }

  revalidatePath('/', 'layout')
  redirect(intent === 'pending' ? '/dashboard?submitted=1' : '/dashboard?created=1')
}

export async function updateArticle(id, prevState, formData) {
  const { supabase, profile } = await requireUser('/dashboard')
  const { title, excerpt, content, category, intent } = readArticleFields(formData)

  if (!title) return { error: 'Give the article a headline.' }
  if (!content) return { error: 'Article body cannot be empty.' }

  const { data: existing } = await supabase
    .from('articles')
    .select('id, cover_image_url, status')
    .eq('id', id)
    .maybeSingle()
  if (!existing) return { error: 'Article not found, or you do not own it.' }

  let cover = null
  try {
    cover = await uploadCover(formData.get('cover'))
  } catch (e) {
    return { error: e.message }
  }
  const coverUrl = cover || String(formData.get('cover_url') || '').trim() || existing.cover_image_url
  if (!coverUrl) {
    return { error: 'Every story needs a cover image — upload one or paste an image URL.' }
  }

  // Status transitions are admin-only (RLS trigger enforces this as well).
  const patch = {
    title,
    excerpt: excerpt || content.replace(/\s+/g, ' ').slice(0, 180),
    content,
    cover_image_url: coverUrl,
    category,
  }
  const requested = String(formData.get('status') || existing.status)
  const isAdmin = profile.role === 'admin'
  const validStatus = ['draft', 'pending', 'published', 'rejected']
  if (isAdmin && validStatus.includes(requested)) patch.status = requested
  else if (!isAdmin && ['draft', 'pending'].includes(requested)) patch.status = requested

  const { error } = await supabase.from('articles').update(patch).eq('id', id)
  if (error) return { error: `Could not update article: ${error.message}` }

  revalidatePath('/', 'layout')
  redirect('/dashboard?updated=1')
}

export async function deleteArticle(id) {
  const { supabase } = await requireUser('/dashboard')
  const { error } = await supabase.from('articles').delete().eq('id', id)
  if (error) redirect(`/dashboard?error=${encodeURIComponent(error.message)}`)
  revalidatePath('/', 'layout')
  redirect('/dashboard?deleted=1')
}

/** Quick row action: move own article between draft and pending review. */
export async function setOwnStatus(id, status) {
  const { supabase } = await requireUser('/dashboard')
  if (!['draft', 'pending'].includes(status)) {
    redirect(`/dashboard?error=${encodeURIComponent('Invalid status.')}`)
  }
  const { error } = await supabase.from('articles').update({ status }).eq('id', id)
  if (error) redirect(`/dashboard?error=${encodeURIComponent(error.message)}`)
  revalidatePath('/', 'layout')
  redirect(status === 'pending' ? '/dashboard?submitted=1' : '/dashboard?withdrawn=1')
}

export async function changePassword(prevState, formData) {
  const { supabase } = await requireUser('/dashboard')
  const password = String(formData.get('password') || '')
  const confirm = String(formData.get('confirm') || '')
  if (password.length < 6) return { error: 'Password must be at least 6 characters.' }
  if (password !== confirm) return { error: 'Passwords do not match.' }
  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: `Could not change password: ${error.message}` }
  return { success: 'Password updated.' }
}

export async function changeDisplayName(prevState, formData) {
  const { user } = await requireUser('/dashboard')
  const fullName = String(formData.get('full_name') || '').trim().slice(0, 80)
  if (!fullName) return { error: 'Name cannot be empty.' }
  const admin = createAdminClient()
  const { error } = await admin.from('profiles').update({ full_name: fullName }).eq('id', user.id)
  if (error) return { error: `Could not update name: ${error.message}` }
  revalidatePath('/dashboard')
  return { success: 'Display name updated.' }
}
