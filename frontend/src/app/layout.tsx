import type { Metadata } from 'next'
import '../lib/polyfills'
import './globals.css'
import { SessionProvider } from '../context/SessionContext'

export const metadata: Metadata = {
  title: 'Sprint Retrospective',
  description: 'Real-time collaborative retrospective tool',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
