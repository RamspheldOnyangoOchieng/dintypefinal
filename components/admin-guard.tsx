"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-context';

interface AdminGuardProps {
    children: React.ReactNode;
    redirectTo?: string;
}

/**
 * AdminGuard - Protects admin routes and maintains session
 * Only redirects if: user is NOT logged in OR user is NOT admin
 * Prevents unnecessary redirects when session is valid
 */
export function AdminGuard({ children, redirectTo = '/admin/login' }: AdminGuardProps) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Only redirect if we're done loading AND (no user OR not admin)
        if (!isLoading && (!user || !user.isAdmin)) {
            console.log('[AdminGuard] Redirecting:', { user: !!user, isAdmin: user?.isAdmin, isLoading });
            router.push(redirectTo);
        }
    }, [user, isLoading, router, redirectTo]);

    // Show loading spinner while checking auth
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-muted-foreground">Verifying admin access...</p>
                </div>
            </div>
        );
    }

    // Show nothing while redirecting
    if (!user || !user.isAdmin) {
        return null;
    }

    // User is authenticated and is admin, show the page
    return <>{children}</>;
}
