import { Suspense } from 'react'
import { GraduationCap } from 'lucide-react'
import { CourseCard } from '@/components/course/CourseCard'
import { CoursesFilter, CourseSearchBar } from './CoursesFilter'
import { CoursesPagination } from './CoursesPagination'
import { categoryApi, courseApi } from '@/lib/api'
import type { Category, Course, CourseType } from '@/types/course'

export const metadata = { title: '강좌' }

interface PageProps {
  searchParams: Promise<{ type?: string; category?: string; q?: string; page?: string }>
}

async function getCoursesData(searchParams: Awaited<PageProps['searchParams']>) {
  const type = (searchParams.type ?? '') as '' | CourseType
  const category = searchParams.category ?? ''
  const q = searchParams.q ?? ''
  const page = Number(searchParams.page ?? 1)

  try {
    const [categories, result] = await Promise.all([
      categoryApi.list(),
      courseApi.list({ type: type || undefined, category: category || undefined, q: q || undefined, page }),
    ])
    return { categories, result, type, category, q, page }
  } catch {
    return {
      categories: [] as Category[],
      result: { data: [] as Course[], total: 0, per_page: 20, current_page: 1, last_page: 1, from: null, to: null },
      type,
      category,
      q,
      page,
    }
  }
}

export default async function CoursesPage({ searchParams }: PageProps) {
  const resolved = await searchParams
  const { categories, result, type, category, q } = await getCoursesData(resolved)

  const activeLabel = type === 'credit_bank'
    ? '학점은행'
    : type === 'certificate'
    ? '자격증'
    : category
    ? (categories.find((c) => c.slug === category)?.name ?? '강좌')
    : q
    ? `"${q}" 검색 결과`
    : '전체 강좌'

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10">
      {/* 페이지 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{activeLabel}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          총 {result.total}개 강좌
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* 사이드바 */}
        <Suspense>
          <CoursesFilter categories={categories} />
        </Suspense>

        {/* 메인 콘텐츠 */}
        <div className="flex-1 min-w-0">
          {/* 검색바 */}
          <div className="flex items-center gap-3 mb-6">
            <Suspense>
              <CourseSearchBar />
            </Suspense>
          </div>

          {/* 강좌 그리드 */}
          {result.data.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {result.data.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
              <Suspense>
                <CoursesPagination
                  currentPage={result.current_page}
                  lastPage={result.last_page}
                />
              </Suspense>
            </>
          ) : (
            /* 빈 상태 */
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <GraduationCap className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-1">강좌가 없습니다</h3>
              <p className="text-sm text-muted-foreground">
                다른 카테고리나 검색어를 시도해 보세요.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
