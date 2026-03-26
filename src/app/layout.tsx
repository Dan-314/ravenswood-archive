import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'
import { NavBar } from '@/components/NavBar'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'BotC Script Finder',
  description: 'Search and discover Blood on the Clocktower scripts',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.className} antialiased min-h-screen bg-background text-foreground`}>
        <Providers>
          <NavBar />
          <main className="mx-auto max-w-7xl px-4 py-8">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
