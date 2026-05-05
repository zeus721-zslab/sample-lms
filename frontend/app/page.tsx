export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { GraduationCap, ArrowRight, BookOpen, Users, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CourseCard } from '@/components/course/CourseCard'
import { categoryApi, courseApi } from '@/lib/api'
import type { Category, Course } from '@/types/course'

const features = [
  { icon: BookOpen, title: '강의 관리', desc: '체계적인 강의 자료와 과제 관리' },
  { icon: Users, title: '역할 기반 접근', desc: '학생·튜터·교수·관리자 권한 분리' },
  { icon: BarChart3, title: '학습 현황', desc: '진도율 및 성취도 실시간 추적' },
]

async function getHomeData() {
  try {
    const [categories, creditCourses, certCourses] = await Promise.all([
      categoryApi.list(),
      courseApi.list({ type: 'credit_bank', page: 1 }),
      courseApi.list({ type: 'certificate', page: 1 }),
    ])
    return {
      categories,
      creditCourses: creditCourses.data.slice(0, 4),
      certCourses: certCourses.data.slice(0, 4),
    }
  } catch {
    return { categories: [] as Category[], creditCourses: [] as Course[], certCourses: [] as Course[] }
  }
}

export default async function HomePage() {
  const { categories, creditCourses, certCourses } = await getHomeData()

  return (
    <div className="flex flex-col">
      {/* ── 히어로 ─────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center px-4 py-24 text-center overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="flex items-center gap-2 mb-4 text-primary">
          <GraduationCap className="h-8 w-8" />
          <span className="text-sm font-semibold tracking-widest uppercase">zslab LMS</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4 max-w-2xl">
          학습을 더 스마트하게
        </h1>
        <p className="max-w-md text-muted-foreground text-lg mb-8">
          학점은행부터 자격증까지 — 목표에 맞는 강좌를 한 곳에서
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button size="lg" asChild>
            <Link href="/courses">강좌 둘러보기</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/register">무료 회원가입</Link>
          </Button>
        </div>
      </section>

      {/* ── 카테고리 퀵링크 ────────────────────────────── */}
      {categories.length > 0 && (
        <section className="border-y border-border/60 bg-muted/20 px-4 py-6">
          <div className="container mx-auto max-w-5xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground mr-1">카테고리</span>
              {categories.map((cat) => (
                <Link key={cat.id} href={`/courses?category=${cat.slug}`}>
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                  >
                    {cat.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 학점은행 인기 강좌 ──────────────────────────── */}
      {creditCourses.length > 0 && (
        <section className="px-4 py-14">
          <div className="container mx-auto max-w-5xl">
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">학점은행</p>
                <h2 className="text-xl font-bold">인기 강좌</h2>
              </div>
              <Button variant="ghost" size="sm" asChild className="gap-1 text-muted-foreground">
                <Link href="/courses?type=credit_bank">
                  전체보기 <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {creditCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 자격증 인기 강좌 ────────────────────────────── */}
      {certCourses.length > 0 && (
        <section className="px-4 py-14 bg-muted/20 border-t border-border/60">
          <div className="container mx-auto max-w-5xl">
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">자격증</p>
                <h2 className="text-xl font-bold">인기 강좌</h2>
              </div>
              <Button variant="ghost" size="sm" asChild className="gap-1 text-muted-foreground">
                <Link href="/courses?type=certificate">
                  전체보기 <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {certCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 특징 ───────────────────────────────────────── */}
      <section className="border-t border-border/60 px-4 py-16">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-center text-xl font-bold mb-10">왜 zslab LMS인가</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-xl border border-border/60 bg-card p-6 space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
