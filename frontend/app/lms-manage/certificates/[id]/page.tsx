'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { adminCertMasterApi } from '@/lib/api'
import { PageHeader } from '@/components/admin/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import type { AdminCertificate } from '@/types/admin-certificate'

export default function CertificateDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { token } = useAuthStore()
  const [cert, setCert] = useState<AdminCertificate | null>(null)
  const [loading, setLoading] = useState(true)
  const [courseInput, setCourseInput] = useState('')
  const [syncing, setSyncing] = useState(false)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await adminCertMasterApi.show(token, Number(id))
      setCert(res)
      setCourseInput((res.courses ?? []).map((c) => String(c.id)).join(', '))
    } catch {
      toast.error('자격증 정보를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [token, id])

  useEffect(() => { load() }, [load])

  const handleSyncCourses = async () => {
    if (!token || !cert) return
    const ids = courseInput.split(',').map((s) => Number(s.trim())).filter(Boolean)
    setSyncing(true)
    try {
      const updated = await adminCertMasterApi.syncCourses(token, cert.id, ids)
      setCert(updated)
      toast.success('연결 강좌가 업데이트되었습니다.')
    } catch {
      toast.error('강좌 연결에 실패했습니다.')
    } finally {
      setSyncing(false)
    }
  }

  if (loading) return <div className="p-6 text-muted-foreground text-sm">로딩 중...</div>
  if (!cert) return <div className="p-6 text-muted-foreground text-sm">자격증을 찾을 수 없습니다.</div>

  return (
    <div>
      <PageHeader
        title={cert.name}
        description={`코드: ${cert.code} · 발급기관: ${cert.issuer ?? '-'}`}
      />
      <div className="p-6 space-y-4">
        {/* 기본 정보 */}
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div><p className="text-xs text-muted-foreground mb-1">코드</p><span className="font-mono text-xs">{cert.code}</span></div>
              <div><p className="text-xs text-muted-foreground mb-1">합격 필수</p><span>{cert.required_pass_yn ? '필수' : '선택'}</span></div>
              <div><p className="text-xs text-muted-foreground mb-1">연결 강좌</p><span>{cert.courses_count}개</span></div>
              <div><p className="text-xs text-muted-foreground mb-1">발급 건수</p><span>{cert.issues_count}건</span></div>
            </div>
          </CardContent>
        </Card>

        {/* 연결 강좌 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">연결 강좌 관리</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cert.courses && cert.courses.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {cert.courses.map((c) => (
                  <Badge key={c.id} variant="secondary" className="text-xs">
                    #{c.id} {c.title}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">연결된 강좌가 없습니다.</p>
            )}
            <div className="space-y-2">
              <Label className="text-xs">강좌 ID 입력 (쉼표로 구분)</Label>
              <div className="flex gap-2">
                <Input
                  value={courseInput}
                  onChange={(e) => setCourseInput(e.target.value)}
                  placeholder="12, 13, 14"
                  className="flex-1"
                />
                <Button onClick={handleSyncCourses} disabled={syncing} size="sm">
                  {syncing ? '저장 중...' : '저장'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">입력한 강좌 ID로 완전히 교체됩니다.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
