'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

const ROLE_LABELS: Record<string, string> = {
  admin: '관리자',
  professor: '교수',
  tutor: '튜터',
  student: '수강생',
}

const STATUS_LABELS: Record<string, string> = {
  active: '활성',
  suspended: '정지',
  withdrawn: '탈퇴',
}

export default function MyPage() {
  const router = useRouter()
  const { user, token, isLoaded } = useAuthStore()

  useEffect(() => {
    if (isLoaded && !token) router.replace('/login')
  }, [isLoaded, token, router])

  if (!isLoaded || !user) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">마이페이지</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{user.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Separator />
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">역할</p>
            <div className="flex flex-wrap gap-1.5">
              {user.roles.length > 0 ? (
                user.roles.map((role) => (
                  <Badge key={role} variant="secondary">
                    {ROLE_LABELS[role] ?? role}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">역할 없음</span>
              )}
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">계정 상태</span>
            <span className="font-medium">{STATUS_LABELS[user.status] ?? user.status}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
