/**
 * Public route configuration
 * These routes are explicitly accessible without authentication
 */

export const PUBLIC_ROUTES = [
    '/',
    '/chat',
    '/characters',
    '/models',
    '/about',
    '/privacy',
    '/terms',
    '/reset-password',
]

export const AUTH_ROUTES = [
    '/login',
    '/signup',
]

export const PROTECTED_ROUTES = [
    '/admin',
    '/profile',
    '/settings',
]

export function isPublicRoute(pathname: string): boolean {
    return PUBLIC_ROUTES.some(route => pathname.startsWith(route))
}

export function isAuthRoute(pathname: string): boolean {
    return AUTH_ROUTES.some(route => pathname.startsWith(route))
}

export function isProtectedRoute(pathname: string): boolean {
    return PROTECTED_ROUTES.some(route => pathname.startsWith(route))
}
