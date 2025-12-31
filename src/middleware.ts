import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { searchParams, pathname } = new URL(request.url);
    const token = searchParams.get('token');
    const forwardUrl = searchParams.get('forwardUrl');

    console.log(`[MIDDLEWARE] Processing request: ${pathname}`);

    // 1. Token Injection Flow (Dev/Cross-Domain)
    // If a token is present in the URL, we assume it's a redirect from the Auth service.
    // We set the cookie and redirect to the clean URL.
    if (token) {
        console.log(`[MIDDLEWARE] Token found in URL. Setting cookie and redirecting.`);
        
        // Determine the destination: forwardUrl or current path without params
        // If the path is /api/auth/callback, we probably want to go to root or forwardUrl
        let destinationUrl;
        
        if (forwardUrl) {
            destinationUrl = new URL(forwardUrl);
        } else if (pathname.startsWith('/api/auth/callback')) {
            destinationUrl = new URL('/', request.url);
        } else {
            destinationUrl = new URL(pathname, request.url);
        }
        
        // Preserve other query params if needed, but remove 'token' and 'forwardUrl'
        searchParams.forEach((value, key) => {
            if (key !== 'token' && key !== 'forwardUrl') {
                destinationUrl.searchParams.set(key, value);
            }
        });

        console.log(`[MIDDLEWARE] Destination: ${destinationUrl.toString()}`);

        const response = NextResponse.redirect(destinationUrl);

        // Set the session cookie
        // The name must match what Auth service uses/expects, usually 'na.stk' or configured via env
        const cookieName = 'na.stk'; 
        const isProd = process.env.NODE_ENV === 'production';

        response.cookies.set({
            name: cookieName,
            value: token,
            httpOnly: true,
            secure: isProd,
            path: '/',
            sameSite: 'lax',
            // No domain set means it applies to the current host (localhost:3000)
            domain: isProd ? '.p-sf.com' : undefined
        });
        
        console.log(`[MIDDLEWARE] Cookie '${cookieName}' set.`);

        return response;
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * 
         * We INCLUDE /api/auth/callback to catch the redirect from Auth service
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
