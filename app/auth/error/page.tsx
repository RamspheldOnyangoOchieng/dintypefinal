"use client"

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AuthErrorPage() {
    const searchParams = useSearchParams()
    const message = searchParams.get('message') || 'An authentication error occurred'

    return (
        <div className="container max-w-md mx-auto py-12 px-4">
            <Card className="border-destructive/50">
                <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                        <AlertCircle className="w-6 h-6 text-destructive" />
                    </div>
                    <CardTitle className="text-2xl">Authentication Error</CardTitle>
                    <CardDescription className="text-base">
                        {decodeURIComponent(message)}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground text-center">
                        The confirmation link may have expired or is invalid. Please try again or contact support if the problem persists.
                    </p>
                    <div className="flex flex-col gap-2">
                        <Button asChild variant="default" className="w-full">
                            <Link href="/">Return Home</Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/reset-password">Request New Reset Link</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
