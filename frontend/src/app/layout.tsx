import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '../components/Providers'

export const metadata: Metadata = {
  title: 'VibeRetro - Real-Time Sprint Retrospectives',
  description: 'Real-time collaborative retrospective tool with zero-config setup. Create cards, group insights, vote on priorities, and define action items.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
