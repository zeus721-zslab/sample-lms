import Link from 'next/link'
import Image from 'next/image'
import { BookOpen, GraduationCap } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { CourseTypeBadge } from './CourseTypeBadge'
import { cn } from '@/lib/utils'
import type { Course } from '@/types/course'

function formatPrice(price: number) {
  return price === 0 ? '무료' : `₩${price.toLocaleString('ko-KR')}`
}

export function CourseCard({ course, className }: { course: Course; className?: string }) {
  return (
    <Link href={`/courses/${course.slug}`} className={cn('group block', className)}>
      <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
        {/* 썸네일 */}
        <div className="relative aspect-video w-full bg-muted overflow-hidden">
          {course.thumbnail ? (
            <Image
              src={course.thumbnail}
              alt={course.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <GraduationCap className="h-10 w-10 text-primary/30" />
            </div>
          )}
        </div>

        <CardContent className="p-4 space-y-2">
          {/* 타입 뱃지 */}
          <CourseTypeBadge type={course.course_type} />

          {/* 타이틀 */}
          <h3 className="font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {course.title}
          </h3>

          {/* 강사 */}
          {course.instructor && (
            <p className="text-xs text-muted-foreground truncate">
              {course.instructor.name}
            </p>
          )}
        </CardContent>

        <CardFooter className="px-4 pb-4 pt-0 flex items-center justify-between gap-2">
          {/* 학점 / 강의 수 */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5" />
            <span>{course.total_lessons}강</span>
            {course.credit_hours != null && (
              <span className="ml-1 px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                {course.credit_hours}학점
              </span>
            )}
          </div>

          {/* 가격 */}
          <span className="text-sm font-bold text-primary">{formatPrice(course.price)}</span>
        </CardFooter>
      </Card>
    </Link>
  )
}
