import { getPageMetadata } from '@/lib/page-metadata'
import { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('/faq')
}

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
