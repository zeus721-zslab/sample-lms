'use client'

import { useEffect, useState } from 'react'

function calcDday(endAt: string): string {
  const diff = new Date(endAt).getTime() - Date.now()
  if (diff <= 0) return '마감'
  const days = Math.floor(diff / 86_400_000)
  const hours = Math.floor((diff % 86_400_000) / 3_600_000)
  if (days > 0) return `D-${days}`
  return `D-day (${hours}시간 남음)`
}

export function SemesterDday({ endAt }: { endAt: string }) {
  const [label, setLabel] = useState(calcDday(endAt))

  useEffect(() => {
    const t = setInterval(() => setLabel(calcDday(endAt)), 60_000)
    return () => clearInterval(t)
  }, [endAt])

  return (
    <span className="ml-1 font-semibold text-blue-600 dark:text-blue-400">{label}</span>
  )
}
