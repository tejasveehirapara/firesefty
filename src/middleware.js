import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export function middleware(request) {
    const token = request.cookies.get('auth-token')?.value
    const { pathname } = request.nextUrl

    // Public routes
    const publicRoutes = ['/']

    if (!token) {
        if (!publicRoutes.includes(pathname)) {
            return NextResponse.redirect(new URL('/', request.url))
        }
        return NextResponse.next()
    }




    // Otherwise allow request
    return NextResponse.next()
}

export const config = {
    matcher: '/',
}
