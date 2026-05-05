import { PageHeader } from '@/components/admin/PageHeader'
import { EmptyState } from '@/components/admin/EmptyState'
import { Construction } from 'lucide-react'

export default function Page() {
  return (
    <div>
      <PageHeader title="정지 회원" />
      <div className="p-6">
        <EmptyState
          icon={Construction}
          title="준비 중"
          description="이 페이지는 현재 개발 중입니다."
        />
      </div>
    </div>
  )
}
