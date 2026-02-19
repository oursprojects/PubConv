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

    const path = request.nextUrl.pathname;

    // Retrieve profile to check ban status and role if user exists
    let isBanned = false;
    let userRole = 'user';
    if (user) {
        const { data: profile } = await supabase.from('profiles').select('is_banned, role').eq('id', user.id).single()
        isBanned = !!profile?.is_banned;
        userRole = profile?.role || 'user';
    }

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

    // Check maintenance mode (skip for admins, maintenance page, and auth pages)
    const isMaintenancePage = path.startsWith('/maintenance');
    const isAuthPage = path.startsWith('/login') || path.startsWith('/register') || path.startsWith('/banned');
    const isAdminPage = path.startsWith('/admin');

    if (!isMaintenancePage && !isAuthPage && !isAdminPage && userRole !== 'admin') {
        // Fetch app_config for maintenance mode
        const { data: configs } = await supabase.from('app_config').select('key, value').eq('key', 'maintenance_mode').single();
        const maintenanceValue = configs?.value;
        const maintenanceMode = maintenanceValue === true || maintenanceValue === 'true';

        if (maintenanceMode) {
            const url = request.nextUrl.clone();
            url.pathname = '/maintenance';
            url.searchParams.set('returnTo', path);
            return NextResponse.redirect(url);
        }
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

