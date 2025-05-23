import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Providers from '~/components/providers'

import '../styles/globals.css'
import { Toaster } from '~/components/ui/sonner'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Pulpit',
  description: 'Build your website with resume and AI.',
  icons: {
    icon: '/pulpitlogo.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  )
}
