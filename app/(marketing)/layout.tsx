import { getPageMetadata } from '@/lib/page-metadata'
import { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('/')
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
