'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GraduationCap, Search, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function VerifyPage() {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = token.trim()
    if (!trimmed) {
      setError('확인 코드를 입력하세요.')
      return
    }
    if (trimmed.length < 8) {
      setError('유효하지 않은 확인 코드입니다.')
      return
    }
    router.push(`/verify/${encodeURIComponent(trimmed)}`)
  }

  return (
    <div className="min-h-screen bg-muted/30 dark:bg-background">
      {/* 공식 헤더 */}
      <header className="border-b border-border/60 bg-background">
        <div className="container mx-auto max-w-3xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity">
            <GraduationCap className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm tracking-tight">zslab Academy</span>
          </Link>
          <span className="text-xs text-muted-foreground">자격증 진위확인 시스템</span>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-4 py-16 space-y-8">
        {/* 타이틀 */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">자격증 진위확인</h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            zslab Academy에서 발급한 자격증의 진위를 확인합니다.
            자격증에 인쇄된 QR 코드를 스캔하거나 확인 코드를 직접 입력하세요.
          </p>
        </div>

        {/* 검색 폼 */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="token" className="text-sm font-medium">
                확인 코드 <span className="text-muted-foreground font-normal">(자격증 하단 또는 QR 링크에 포함)</span>
              </Label>
              <Input
                id="token"
                value={token}
                onChange={(e) => { setToken(e.target.value); setError('') }}
                placeholder="예: 0abf9708b2275167498e64e223930694"
                className="font-mono text-sm h-11"
                autoComplete="off"
                autoFocus
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
              <p className="text-[11px] text-muted-foreground">
                확인 코드는 자격증 PDF 하단의 TOKEN 항목 또는 진위확인 QR 코드 URL에 포함되어 있습니다.
              </p>
            </div>

            <Button type="submit" className="w-full h-11 gap-2 text-sm font-semibold">
              <Search className="h-4 w-4" />
              자격증 진위확인
            </Button>
          </form>
        </div>

        {/* 안내 카드 */}
        <div className="grid gap-4 sm:grid-cols-3 text-center text-sm">
          {[
            { icon: '📄', title: 'PDF 자격증', desc: '수료 후 PDF 자격증을 발급받을 수 있습니다.' },
            { icon: '📱', title: 'QR 코드', desc: '자격증의 QR 코드를 스캔해 즉시 확인하세요.' },
            { icon: '🔒', title: '안전한 확인', desc: '모든 확인 기록은 안전하게 보관됩니다.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="rounded-xl border border-border bg-card px-4 py-5">
              <div className="text-2xl mb-2">{icon}</div>
              <p className="font-semibold text-sm mb-1">{title}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* 공식 푸터 */}
      <footer className="border-t border-border/60 bg-background mt-10">
        <div className="container mx-auto max-w-3xl px-4 py-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} zslab Academy. 자격증 진위확인 시스템
        </div>
      </footer>
    </div>
  )
}
