'use client'

import { useEffect, useRef, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { GraduationCap, Loader2, AlertTriangle, ShieldCheck } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { ApiError } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const schema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다.'),
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
})
type FormValues = z.infer<typeof schema>

const LOCK_KEY = 'lms_admin_lock'
const MAX_ATTEMPTS = 5
const LOCK_MS = 60_000 // 1분

function safeReturnUrl(url: string | null): string | null {
  if (!url) return null
  if (url.startsWith('/') && !url.startsWith('//') && !url.startsWith('/lms-manage/login')) return url
  return null
}

function getLockState(): { attempts: number; lockedUntil: number } {
  try {
    return JSON.parse(localStorage.getItem(LOCK_KEY) ?? '{"attempts":0,"lockedUntil":0}')
  } catch {
    return { attempts: 0, lockedUntil: 0 }
  }
}

function saveLockState(state: { attempts: number; lockedUntil: number }) {
  try { localStorage.setItem(LOCK_KEY, JSON.stringify(state)) } catch {}
}

function AdminLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = safeReturnUrl(searchParams.get('return_url'))

  const reason = searchParams.get('reason')
  const { login, logout, user, isLoaded } = useAuthStore()

  const [attempts, setAttempts] = useState(0)
  const [lockRemaining, setLockRemaining] = useState(0)
  const lockInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  // 세션 만료 toast
  useEffect(() => {
    if (reason === 'session_expired') {
      toast.warning('다른 기기에서 로그인되어 자동 로그아웃되었습니다.')
    }
  }, [reason])

  // 이미 admin으로 로그인된 경우 바로 이동
  useEffect(() => {
    if (!isLoaded || !user) return
    if (user.roles.includes('admin')) {
      router.replace(returnUrl ?? '/lms-manage')
    }
  }, [isLoaded, user, returnUrl, router])

  // 잠금 카운트다운
  useEffect(() => {
    const { attempts: a, lockedUntil } = getLockState()
    setAttempts(a)
    const remaining = Math.ceil((lockedUntil - Date.now()) / 1000)
    if (remaining > 0) {
      setLockRemaining(remaining)
      lockInterval.current = setInterval(() => {
        setLockRemaining((prev) => {
          if (prev <= 1) {
            if (lockInterval.current) clearInterval(lockInterval.current)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => { if (lockInterval.current) clearInterval(lockInterval.current) }
  }, [])

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormValues) => {
    const lock = getLockState()

    if (Date.now() < lock.lockedUntil) {
      toast.error('로그인이 잠금 상태입니다. 잠시 후 다시 시도해주세요.')
      return
    }

    try {
      await login(data.email, data.password)
      const { user: loggedInUser, token } = useAuthStore.getState()

      // admin 역할 확인
      if (!loggedInUser?.roles.includes('admin')) {
        // admin이 아니면 즉시 로그아웃
        if (token) await logout()
        saveLockState({ attempts: 0, lockedUntil: 0 }) // 잠금은 초기화 (역할 오류는 잠금 대상 아님)
        toast.error('관리자 권한이 없습니다. 관리자 계정으로 로그인해주세요.')
        return
      }

      // 성공: 잠금 초기화
      saveLockState({ attempts: 0, lockedUntil: 0 })
      setAttempts(0)
      toast.success('관리자로 로그인되었습니다.')
      router.push(returnUrl ?? '/lms-manage')
    } catch (err) {
      const newAttempts = lock.attempts + 1
      const willLock = newAttempts >= MAX_ATTEMPTS
      const newLock = {
        attempts: newAttempts,
        lockedUntil: willLock ? Date.now() + LOCK_MS : lock.lockedUntil,
      }
      saveLockState(newLock)
      setAttempts(newAttempts)

      if (willLock) {
        setLockRemaining(LOCK_MS / 1000)
        lockInterval.current = setInterval(() => {
          setLockRemaining((prev) => {
            if (prev <= 1) {
              if (lockInterval.current) clearInterval(lockInterval.current)
              saveLockState({ attempts: 0, lockedUntil: 0 })
              setAttempts(0)
              return 0
            }
            return prev - 1
          })
        }, 1000)
        toast.error(`로그인 시도 ${MAX_ATTEMPTS}회 초과. 1분간 잠금됩니다.`)
      } else {
        toast.error(
          err instanceof ApiError
            ? err.message
            : `로그인 실패 (${newAttempts}/${MAX_ATTEMPTS}회)`,
        )
      }
    }
  }

  const isLocked = lockRemaining > 0

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">

        {/* 로고 */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-indigo-600 mb-3">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-white tracking-tight">zslab LMS</h1>
          <p className="text-sm text-zinc-400">관리자 로그인</p>
        </div>

        {/* 잠금 경고 */}
        {isLocked && (
          <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
            <p className="text-sm text-red-300">
              로그인 잠금 중 — <span className="font-mono font-semibold">{lockRemaining}초</span> 후 재시도 가능
            </p>
          </div>
        )}

        {/* 폼 */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm text-zinc-300">이메일</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@example.com"
              autoComplete="email"
              disabled={isLocked}
              className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 h-10"
              {...register('email')}
            />
            {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm text-zinc-300">비밀번호</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={isLocked}
              className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 h-10"
              {...register('password')}
            />
            {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || isLocked}
            className="w-full h-10 bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
          >
            {isSubmitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />로그인 중...</>
            ) : isLocked ? (
              `잠금 중 (${lockRemaining}s)`
            ) : (
              <><ShieldCheck className="mr-2 h-4 w-4" />관리자 로그인</>
            )}
          </Button>

          {/* 시도 횟수 표시 */}
          {attempts > 0 && attempts < MAX_ATTEMPTS && !isLocked && (
            <p className="text-center text-xs text-zinc-500">
              로그인 시도 {attempts}/{MAX_ATTEMPTS}회 — {MAX_ATTEMPTS - attempts}회 남음
            </p>
          )}
        </form>

        {/* 학습자 사이트 링크 */}
        <p className="text-center text-xs text-zinc-600">
          학습자 사이트는{' '}
          <a href="/" className="text-zinc-400 hover:text-white transition-colors underline underline-offset-2">
            여기
          </a>
          에서 접속하세요.
        </p>
      </div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    }>
      <AdminLoginForm />
    </Suspense>
  )
}
