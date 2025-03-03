import './globals.css'
import type { Metadata } from 'next'
import { Inter as FontSans } from "next/font/google"
import ClientBody from '@/components/ClientBody'
import { ThemeProvider } from '@/providers/ThemeProvider'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Brain Dump App',
  description: 'Capture, categorize, and sync your thoughts',
}

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        "min-h-screen bg-background font-sans antialiased",
        fontSans.variable
      )}>
        <ThemeProvider
          defaultTheme="dark"
          storageKey="brain-dump-theme"
        >
          <ClientBody>
            {children}
          </ClientBody>
        </ThemeProvider>
      </body>
    </html>
  )
}
