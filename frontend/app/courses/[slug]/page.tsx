import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { GraduationCap, BookOpen, Clock, User, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CourseTypeBadge } from '@/components/course/CourseTypeBadge'
import { CourseCard } from '@/components/course/CourseCard'
import { EnrollButton } from './EnrollButton'
import { courseApi, categoryApi } from '@/lib/api'
import type { Course } from '@/types/course'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  try {
    const course = await courseApi.detail(slug)
    return { title: course.title }
  } catch {
    return { title: '강좌 상세' }
  }
}

const MODE_LABEL: Record<string, string> = {
  ondemand: '자유수강',
  semester: '학기제',
}

async function getDetailData(slug: string) {
  try {
    const course = await courseApi.detail(slug)
    const categories = await categoryApi.list()
    const related = await courseApi.list({
      category: course.category.slug,
    })
    const relatedCourses = related.data
      .filter((c: Course) => c.slug !== slug)
      .slice(0, 4)
    return { course, relatedCourses, categories }
  } catch (err) {
    console.error('[CourseDetail] getDetailData error for slug:', slug, err)
    return null
  }
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { slug } = await params
  const data = await getDetailData(slug)

  if (!data) notFound()

  const { course, relatedCourses } = data

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10">
      {/* 브레드크럼 */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6">
        <Link href="/courses" className="hover:text-foreground transition-colors">강좌</Link>
        <ChevronRight className="h-3 w-3" />
        <Link
          href={`/courses?category=${course.category.slug}`}
          className="hover:text-foreground transition-colors"
        >
          {course.category.name}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground truncate max-w-[200px]">{course.title}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* 메인 콘텐츠 */}
        <div className="lg:col-span-2 space-y-8">
          {/* 썸네일 */}
          <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-muted">
            {course.thumbnail ? (
              <Image
                src={course.thumbnail}
                alt={course.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 66vw"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                <GraduationCap className="h-16 w-16 text-primary/25" />
              </div>
            )}
          </div>

          {/* 타이틀 + 메타 */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <CourseTypeBadge type={course.course_type} />
              <Badge variant="outline" className="text-xs">
                {MODE_LABEL[course.mode] ?? course.mode}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold leading-snug">{course.title}</h1>
            {course.instructor && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{course.instructor.name}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* 강좌 소개 */}
          <div>
            <h2 className="text-base font-semibold mb-3">강좌 소개</h2>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {course.description}
            </p>
          </div>

          {/* 관련 강좌 */}
          {relatedCourses.length > 0 && (
            <div>
              <Separator className="mb-8" />
              <h2 className="text-base font-semibold mb-4">관련 강좌</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {relatedCourses.map((c) => (
                  <CourseCard key={c.id} course={c} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 사이드 카드 */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 rounded-xl border border-border/60 bg-card p-6 space-y-5 shadow-sm">
            {/* 가격 */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">수강료</p>
              <p className="text-2xl font-bold text-primary">
                {course.price === 0 ? '무료' : `₩${course.price.toLocaleString('ko-KR')}`}
              </p>
            </div>

            <Separator />

            {/* 강좌 정보 */}
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center gap-2 text-muted-foreground">
                <BookOpen className="h-4 w-4 shrink-0" />
                <span>총 {course.total_lessons}강</span>
              </li>
              {course.credit_hours != null && (
                <li className="flex items-center gap-2 text-muted-foreground">
                  <GraduationCap className="h-4 w-4 shrink-0" />
                  <span>{course.credit_hours}학점</span>
                </li>
              )}
              <li className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4 shrink-0" />
                <span>{MODE_LABEL[course.mode] ?? course.mode}</span>
              </li>
            </ul>

            <Separator />

            {/* 수강신청 버튼 (Client Component) */}
            <EnrollButton courseId={course.id} courseType={course.course_type} price={course.price} courseTitle={course.title} />

            <p className="text-[11px] text-center text-muted-foreground">
              결제 전 환불 정책을 확인하세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
