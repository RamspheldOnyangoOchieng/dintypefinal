import { getPageMetadata } from '@/lib/page-metadata'
import { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('/characters')
}

export default function CharactersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
