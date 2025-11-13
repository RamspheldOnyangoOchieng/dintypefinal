import { getPageMetadata } from '@/lib/page-metadata'
import { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('/premium')
}

export default function PremiumLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
