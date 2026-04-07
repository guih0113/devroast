import type { Metadata } from 'next'
import { JetBrains_Mono } from 'next/font/google'
import { Suspense } from 'react'
import { Navbar } from '@/components/ui/navbar'
import { TRPCReactProvider } from '@/trpc/client'
import './globals.css'

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap'
})

export const metadata: Metadata = {
  title: 'devroast',
  description: ''
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={jetbrainsMono.variable}>
      <body>
        <Suspense>
          <TRPCReactProvider>
            <Navbar />
            {children}
          </TRPCReactProvider>
        </Suspense>
      </body>
    </html>
  )
}
