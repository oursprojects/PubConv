import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request,
                    })
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

    // Retrieve profile to check ban status if user exists
    let isBanned = false;
    if (user) {
        const { data: profile } = await supabase.from('profiles').select('is_banned').eq('id', user.id).single()
        isBanned = !!profile?.is_banned;
    }

    const path = request.nextUrl.pathname;

    // If banned, redirect to banned page (unless already there or logging out)
    if (isBanned && !path.startsWith('/banned')) {
        await supabase.auth.signOut();
        const url = request.nextUrl.clone();
        url.pathname = '/banned';
        url.searchParams.set('reason', 'banned');
        const redirectRes = NextResponse.redirect(url);

        // Copy cookies from initial response (where signOut wrote deletions) to redirectRes
        const cookiesToSet = response.cookies.getAll();
        cookiesToSet.forEach(c => redirectRes.cookies.set(c));

        return redirectRes;
    }

    // Protected Routes (Add your protected paths here)
    const isProtectedRoute =
        path === '/' ||
        path.startsWith('/chat') ||
        path.startsWith('/profile') ||
        path.startsWith('/admin') ||
        path.startsWith('/search') ||
        path.startsWith('/feedback') ||
        path.startsWith('/about'); // About might be public? Assuming protect for now as per "in the inside"

    // Auth Routes
    const isAuthRoute = path.startsWith('/login') || path.startsWith('/register');

    if (isProtectedRoute && !user) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (isAuthRoute && user) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return response
}
