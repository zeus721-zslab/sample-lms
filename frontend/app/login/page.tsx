'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { ApiError } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

const schema = z.object({
  email: z.string().email('올바른 이메일을 입력해주세요.'),
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
})
type FormValues = z.infer<typeof schema>

/** return_url이 내부 경로인지 검증 (open-redirect 방지) */
function safeReturnUrl(url: string | null): string | null {
  if (!url) return null
  // 상대 경로이고 //로 시작하지 않는 경우만 허용
  if (url.startsWith('/') && !url.startsWith('//')) return url
  return null
}

/** 역할에 따른 기본 이동 경로 */
function defaultRedirectForUser(roles: string[]): string {
  if (roles.includes('admin')) return '/lms-manage'
  return '/my'
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = safeReturnUrl(searchParams.get('return_url'))

  const reason = searchParams.get('reason')
  const { login, user, isLoaded } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  // 세션 만료 toast
  useEffect(() => {
    if (reason === 'session_expired') {
      toast.warning('다른 기기에서 로그인되어 자동 로그아웃되었습니다.')
    }
  }, [reason])

  // 이미 로그인된 경우: return_url 또는 역할별 기본 경로로 이동
  useEffect(() => {
    if (!isLoaded || !user) return
    const dest = returnUrl ?? defaultRedirectForUser(user.roles)
    router.replace(dest)
  }, [isLoaded, user, returnUrl, router])

  const onSubmit = async (data: FormValues) => {
    try {
      await login(data.email, data.password)
      const { user: loggedInUser } = useAuthStore.getState()
      const dest = returnUrl ?? defaultRedirectForUser(loggedInUser?.roles ?? [])
      toast.success('로그인되었습니다.')
      router.push(dest)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : '로그인 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">로그인</CardTitle>
          <CardDescription>계정에 로그인하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                autoComplete="email"
                {...register('email')}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                {...register('password')}
              />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              로그인
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center text-sm text-muted-foreground">
          계정이 없으신가요?&nbsp;
          <Link href="/register" className="text-primary font-medium hover:underline">
            회원가입
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
