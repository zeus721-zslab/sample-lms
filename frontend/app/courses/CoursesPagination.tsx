'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CoursesPagination({
  currentPage,
  lastPage,
}: {
  currentPage: number
  lastPage: number
}) {
  const router = useRouter()
  const params = useSearchParams()
  const [, startTransition] = useTransition()

  if (lastPage <= 1) return null

  const goTo = (page: number) => {
    const next = new URLSearchParams(params.toString())
    if (page === 1) next.delete('page')
    else next.set('page', String(page))
    startTransition(() => router.push(`/courses?${next.toString()}`))
  }

  return (
    <div className="flex items-center justify-center gap-2 pt-8">
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        disabled={currentPage <= 1}
        onClick={() => goTo(currentPage - 1)}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <span className="text-sm text-muted-foreground px-2">
        {currentPage} / {lastPage}
      </span>

      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        disabled={currentPage >= lastPage}
        onClick={() => goTo(currentPage + 1)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
