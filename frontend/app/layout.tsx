import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/providers'
import { SiteShell } from '@/components/layout/SiteShell'

export const metadata: Metadata = {
  title: { default: 'zslab LMS', template: '%s | zslab LMS' },
  description: 'zslab 학습 관리 시스템',
}

const isLocal = process.env.NEXT_PUBLIC_APP_ENV === 'local'

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
        {isLocal && (
          <div className="w-full flex items-center justify-center gap-2 bg-amber-400 py-1 text-xs font-semibold text-amber-950">
            <span>⚠</span>
            <span>개발 서버 (LOCAL)</span>
          </div>
        )}
        <Providers>
          <SiteShell>{children}</SiteShell>
        </Providers>
      </body>
    </html>
  )
}
