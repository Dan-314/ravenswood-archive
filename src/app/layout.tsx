import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'
import { NavBar } from '@/components/NavBar'

const geist = Geist({ subsets: ['latin'] })

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ravenswood.app'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Ravenswood Archive',
    template: '%s — Ravenswood Archive',
  },
  description: 'Search and discover Blood on the Clocktower scripts',
  openGraph: {
    type: 'website',
    siteName: 'Ravenswood Archive',
    title: 'Ravenswood Archive',
    description: 'Search and discover Blood on the Clocktower scripts',
  },
  twitter: {
    card: 'summary',
    title: 'Ravenswood Archive',
    description: 'Search and discover Blood on the Clocktower scripts',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.className} antialiased min-h-screen bg-background text-foreground flex flex-col`}>
        <Providers>
          <NavBar />
          <main className="mx-auto max-w-7xl px-4 py-8 w-full flex-1">
            {children}
          </main>
          <footer className="border-t mt-8 py-6">
            <div className="mx-auto max-w-7xl px-4 flex items-center justify-center">
              <a href="https://release.botc.app/resources/" target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://release.botc.app/resources/community/ccc-parchment.png"
                  alt="Clocktower Community Content"
                  style={{ height: 50, width: 'auto', transition: 'filter 0.2s', filter: 'brightness(1)' }}
                  className="hover:brightness-125"
                />
              </a>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  )
}
