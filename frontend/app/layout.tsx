import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/providers'
import { SiteShell } from '@/components/layout/SiteShell'

export const metadata: Metadata = {
  title: { default: 'zslab LMS', template: '%s | zslab LMS' },
  description: 'zslab 학습 관리 시스템',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          <SiteShell>{children}</SiteShell>
        </Providers>
      </body>
    </html>
  )
}
