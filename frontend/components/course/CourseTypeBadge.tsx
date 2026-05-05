import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { CourseType } from '@/types/course'

const TYPE_MAP: Record<CourseType, { label: string; className: string }> = {
  credit_bank: {
    label: '학점은행',
    className: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800',
  },
  certificate: {
    label: '자격증',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
  },
}

export function CourseTypeBadge({
  type,
  className,
}: {
  type: CourseType
  className?: string
}) {
  const { label, className: typeClass } = TYPE_MAP[type]
  return (
    <Badge variant="outline" className={cn('font-medium', typeClass, className)}>
      {label}
    </Badge>
  )
}
