import { cn } from '@/lib/utils'

type Status = string

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  // User
  active:       { label: '활성',    cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  suspended:    { label: '정지',    cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  withdrawn:    { label: '탈퇴',    cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  // Course
  draft:        { label: '초안',    cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  published:    { label: '공개',    cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  closed:       { label: '종료',    cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  // Enrollment
  pending:      { label: '대기',    cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  studying:     { label: '수강중',  cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  completed:    { label: '수료',    cls: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  // Semester
  planned:      { label: '예정',    cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  enrolling:    { label: '신청중',  cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  // Course type
  certificate:  { label: '자격증',  cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  credit_bank:  { label: '학점은행', cls: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' },
  // Offering
  open:         { label: '모집중',  cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  full:         { label: '정원마감', cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  // Enrollment (extended)
  paid:         { label: '결제',    cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  failed:       { label: '미수료',  cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  // Credit application
  requested:          { label: '신청',      cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  processing:         { label: '처리중',    cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  submitted_to_nile:  { label: 'NILE제출',  cls: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
  approved:           { label: '승인',      cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  rejected:           { label: '반려',      cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  // Grading
  submitted:          { label: '채점대기',  cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  graded:             { label: '채점완료',  cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  in_progress:        { label: '진행중',    cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  // Certificate
  revoked:            { label: '회수됨',    cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  // Order
  cancelled:          { label: '취소',      cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  refunded:           { label: '환불',      cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
}

export function StatusBadge({ status }: { status: Status }) {
  const map = STATUS_MAP[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600' }
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', map.cls)}>
      {map.label}
    </span>
  )
}
