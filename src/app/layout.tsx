import './globals.css'
import type { Metadata } from 'next'
import QueryProvider from '@/providers/QueryProvider'

export const metadata: Metadata = {
  title: 'Brain Dump App',
  description: 'Capture, categorize, and sync your thoughts',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  )
}
