import { NextResponse, NextRequest } from "next/server"
import { GET as checkPremiumStatus } from "../check-premium-status/route"

/**
 * Legacy endpoint maintained for backward compatibility.
 * Proxies requests to the new and more robust check-premium-status endpoint.
 */
export async function GET(request: NextRequest) {
    // Transfer to the new unified endpoint
    return checkPremiumStatus(request as any)
}
