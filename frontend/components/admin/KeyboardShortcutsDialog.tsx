'use client'

import { Dialog, DialogContent } from '@/components/ui/dialog'

const SHORTCUTS = [
  { keys: ['⌘', 'K'], label: '전역 검색' },
  { keys: ['⌘', 'B'], label: '사이드바 토글' },
  { keys: ['?'], label: '단축키 가이드' },
  { keys: ['Esc'], label: '모달 닫기' },
  { keys: ['↑', '↓'], label: '목록 이동' },
  { keys: ['↵'], label: '선택 확인' },
]

interface Props {
  open: boolean
  onClose: () => void
}

export function KeyboardShortcutsDialog({ open, onClose }: Props) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-semibold">키보드 단축키</h2>
            <p className="text-xs text-muted-foreground mt-0.5">관리자 패널에서 사용할 수 있는 단축키입니다.</p>
          </div>
          <div className="space-y-2">
            {SHORTCUTS.map(({ keys, label }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{label}</span>
                <div className="flex items-center gap-1">
                  {keys.map((k) => (
                    <kbd
                      key={k}
                      className="px-2 py-1 text-xs font-mono bg-muted border border-border rounded"
                    >
                      {k}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
