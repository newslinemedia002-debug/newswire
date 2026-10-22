import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

// Refreshes the Supabase session cookie on every request (refresh tokens are
// single-use, so this must happen in a place allowed to write cookies), and
// keeps anonymous visitors out of authenticated areas early.
export async function proxy(request) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.search = `?next=${encodeURIComponent(pathname)}`
      return NextResponse.redirect(url)
    }
  }

  if (pathname === '/login' && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|covers/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
