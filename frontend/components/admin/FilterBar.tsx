'use client'

import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface SelectOption {
  value: string
  label: string
}

interface FilterBarProps {
  search: string
  onSearchChange: (v: string) => void
  searchPlaceholder?: string
  selects?: Array<{
    value: string
    onChange: (v: string) => void
    options: SelectOption[]
    placeholder: string
  }>
  onReset?: () => void
}

export function FilterBar({ search, onSearchChange, searchPlaceholder = '검색...', selects, onReset }: FilterBarProps) {
  const hasFilters = search || selects?.some((s) => s.value)

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="h-8 pl-8 text-sm"
        />
      </div>
      {selects?.map((sel, i) => (
        <select
          key={i}
          value={sel.value}
          onChange={(e) => sel.onChange(e.target.value)}
          className="h-8 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">{sel.placeholder}</option>
          {sel.options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ))}
      {hasFilters && onReset && (
        <Button variant="ghost" size="sm" onClick={onReset} className="h-8 gap-1.5 text-muted-foreground">
          <X className="h-3.5 w-3.5" />
          초기화
        </Button>
      )}
    </div>
  )
}
