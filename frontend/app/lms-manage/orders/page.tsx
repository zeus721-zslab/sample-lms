'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { RotateCcw, Search } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuthStore } from '@/store/auth'
import { adminOrderApi, ApiError } from '@/lib/api'
import type { AdminOrder } from '@/types/order'

const STATUS_OPTIONS = [
  { value: '', label: '전체 상태' },
  { value: 'pending', label: '결제 대기' },
  { value: 'paid', label: '결제 완료' },
  { value: 'cancelled', label: '취소됨' },
  { value: 'refunded', label: '환불됨' },
]

export default function AdminOrdersPage() {
  const { token } = useAuthStore()
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [refundTarget, setRefundTarget] = useState<AdminOrder | null>(null)
  const [refunding, setRefunding] = useState(false)

  const fetchOrders = useCallback(async (p = 1) => {
    if (!token) return
    setLoading(true)
    try {
      const res = await adminOrderApi.list(token, {
        status: statusFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        page: p,
      })
      setOrders(res.data)
      setTotal(res.total)
      setPage(res.current_page)
      setLastPage(res.last_page)
    } catch {
      toast.error('주문 목록 조회에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }, [token, statusFilter, dateFrom, dateTo])

  useEffect(() => { fetchOrders(1) }, [fetchOrders])

  const handleRefund = async () => {
    if (!token || !refundTarget) return
    setRefunding(true)
    try {
      await adminOrderApi.refund(token, refundTarget.id)
      toast.success('환불 처리가 완료되었습니다.')
      setRefundTarget(null)
      fetchOrders(page)
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message)
      else toast.error('환불 처리 중 오류가 발생했습니다.')
    } finally {
      setRefunding(false)
    }
  }

  return (
    <div>
      <PageHeader title="주문 관리" description={`전체 ${total}건`} />

      {/* 필터 바 */}
      <div className="p-6 border-b">
        <div className="flex flex-wrap gap-3 items-end">
          <Select
            value={statusFilter || '_all'}
            onValueChange={(v) => setStatusFilter(v === '_all' ? '' : v)}
          >
            <SelectTrigger className="w-36 h-9">
              <SelectValue placeholder="전체 상태" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value || '_all'}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 w-40"
            />
            <span className="text-sm text-muted-foreground">~</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9 w-40"
            />
          </div>

          <Button size="sm" onClick={() => fetchOrders(1)} className="h-9">
            <Search className="h-4 w-4 mr-1" />
            조회
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-9"
            onClick={() => {
              setStatusFilter('')
              setDateFrom('')
              setDateTo('')
            }}
          >
            초기화
          </Button>
        </div>
      </div>

      {/* 테이블 */}
      <div className="p-6">
        {loading ? (
          <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
            불러오는 중...
          </div>
        ) : orders.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
            조회된 주문이 없습니다.
          </div>
        ) : (
          <>
            <div className="rounded-md border overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">주문번호</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">회원</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">강좌</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">금액</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">상태</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">결제일시</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{order.order_no}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{order.user?.name ?? '-'}</div>
                        <div className="text-xs text-muted-foreground">{order.user?.email}</div>
                      </td>
                      <td className="px-4 py-3 max-w-[200px] truncate">
                        {order.course?.title ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        ₩{order.amount.toLocaleString('ko-KR')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {order.paid_at
                          ? new Date(order.paid_at).toLocaleString('ko-KR')
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {order.status === 'paid' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => setRefundTarget(order)}
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            환불
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {lastPage > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => fetchOrders(page - 1)}
                >
                  이전
                </Button>
                <span className="text-sm text-muted-foreground">
                  {page} / {lastPage}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= lastPage}
                  onClick={() => fetchOrders(page + 1)}
                >
                  다음
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={!!refundTarget}
        onClose={() => setRefundTarget(null)}
        onConfirm={handleRefund}
        title="환불 처리"
        description={
          refundTarget
            ? `주문 ${refundTarget.order_no} (₩${refundTarget.amount.toLocaleString('ko-KR')})을 환불 처리합니다. 수강도 취소됩니다.`
            : ''
        }
        destructive
        loading={refunding}
      />
    </div>
  )
}
