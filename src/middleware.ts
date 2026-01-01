import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { searchParams, pathname } = new URL(request.url);
    const token = searchParams.get('token');
    const forwardUrl = searchParams.get('forwardUrl');

    console.log(`[MIDDLEWARE] Processing request: ${pathname}`);

    if (token) {
        console.log(`[MIDDLEWARE] Token found in URL. Value starts with: ${token.substring(0, 10)}...`);
        
        let destinationUrl;
        if (forwardUrl) {
            destinationUrl = new URL(forwardUrl);
        } else if (pathname.startsWith('/api/auth/callback')) {
            destinationUrl = new URL('/', request.url);
        } else {
            destinationUrl = new URL(pathname, request.url);
        }
        
        searchParams.forEach((value, key) => {
            if (key !== 'token' && key !== 'forwardUrl') {
                destinationUrl.searchParams.set(key, value);
            }
        });

        console.log(`[MIDDLEWARE] Destination: ${destinationUrl.toString()}`);

        const response = NextResponse.redirect(destinationUrl);

        const cookieName = 'na.stk'; 
        const isProd = process.env.NODE_ENV === 'production';

        // Delete the cookie first to ensure we are overwriting any existing one (like a Reference Token)
        response.cookies.delete(cookieName);

        response.cookies.set({
            name: cookieName,
            value: token,
            httpOnly: true,
            secure: isProd,
            path: '/',
            sameSite: 'lax',
            domain: isProd ? '.p-sf.com' : undefined
        });
        
        console.log(`[MIDDLEWARE] Cookie '${cookieName}' set.`);

        return response;
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
