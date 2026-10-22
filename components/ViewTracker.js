'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ViewTracker({ slug }) {
  useEffect(() => {
    if (!slug) return
    const supabase = createClient()
    supabase.rpc('increment_views', { p_slug: slug }).then(() => {})
  }, [slug])

  return null
}
