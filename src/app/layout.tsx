import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'
import { ThemeToggle } from '@/components/ThemeToggle'
import { AuthButton } from '@/components/AuthButton'
import Link from 'next/link'

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
          <header className="border-b">
            <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
              <div className="flex items-center gap-6">
                <Link href="/" className="font-semibold tracking-tight">
                  BotC Script Finder
                </Link>
                <nav className="flex items-center gap-4 text-sm">
                  <Link href="/submit" className="text-muted-foreground hover:text-foreground transition-colors">
                    Submit
                  </Link>
                  <Link href="/competitions" className="text-muted-foreground hover:text-foreground transition-colors">
                    Competitions
                  </Link>
                </nav>
              </div>
              <div className="flex items-center gap-2">
                <AuthButton />
                <ThemeToggle />
              </div>
            </div>
          </header>
          <main className="mx-auto max-w-7xl px-4 py-8">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
