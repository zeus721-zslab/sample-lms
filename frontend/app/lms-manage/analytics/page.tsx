import { PageHeader } from '@/components/admin/PageHeader'

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader title="접속 통계" description="nginx 접속 로그 기반 Kibana 대시보드" />
      <iframe
        src="/kibana/app/dashboards#/view/d75117b2-b1c6-49af-a2d5-876e216a05f9"
        className="w-full flex-1 border-0"
        style={{ minHeight: 'calc(100vh - 4rem)' }}
        title="Kibana 접속 통계 대시보드"
      />
    </div>
  )
}
