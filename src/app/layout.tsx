import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'
import { NavBar } from '@/components/NavBar'

const geist = Geist({ subsets: ['latin'] })

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ravenswoodarchive.com'

const description = 'Browse, search and download Blood on the Clocktower scripts. Find BotC homebrew scripts, custom scripts and official scripts for your next Clocktower game.'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Ravenswood Archive — Blood on the Clocktower Script Finder',
    template: '%s — Ravenswood Archive',
  },
  description,
  keywords: [
    'Blood on the Clocktower',
    'BotC',
    'Clocktower scripts',
    'BotC scripts',
    'homebrew scripts',
    'custom scripts',
    'script finder',
    'Ravenswood Archive',
  ],
  openGraph: {
    type: 'website',
    siteName: 'Ravenswood Archive',
    title: 'Ravenswood Archive — Blood on the Clocktower Script Finder',
    description,
  },
  twitter: {
    card: 'summary',
    title: 'Ravenswood Archive — Blood on the Clocktower Script Finder',
    description,
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Ravenswood Archive',
  alternateName: ['BotC Script Finder', 'Clocktower Script Finder'],
  url: siteUrl,
  description,
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${siteUrl}/?q={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.className} antialiased min-h-screen bg-background text-foreground flex flex-col`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Providers>
          <NavBar />
          <main className="mx-auto max-w-7xl px-4 py-8 w-full flex-1">
            {children}
          </main>
          <footer className="border-t mt-8 py-6">
            <div className="mx-auto max-w-7xl px-4 relative flex items-center justify-center">
              <a href="https://github.com/Dan-314/ravenswood-archive-stacks" target="_blank" rel="noopener noreferrer" className="absolute left-4 text-sm text-muted-foreground hover:text-foreground transition-colors">
                The Stacks - Public Archive Project
              </a>
              <a href="https://release.botc.app/resources/" target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://release.botc.app/resources/community/ccc-parchment.png"
                  alt="Clocktower Community Content"
                  style={{ height: 50, width: 'auto', transition: 'filter 0.2s', filter: 'brightness(1)' }}
                  className="hover:brightness-125"
                />
              </a>
              <div className="absolute right-4 flex flex-col items-end gap-1">
                <a href="/api/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  API Docs
                </a>
                <a href="mailto:dan@ravenswoodarchive.com" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Contact
                </a>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  )
}
