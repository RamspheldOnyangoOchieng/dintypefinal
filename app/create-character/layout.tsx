import { getPageMetadata } from '@/lib/page-metadata'
import { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('/create-character')
}

export default function CreateCharacterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
