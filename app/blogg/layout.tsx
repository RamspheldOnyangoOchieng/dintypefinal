import { getPageMetadata } from '@/lib/page-metadata'
import { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('/blogg')
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
