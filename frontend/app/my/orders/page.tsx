'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ShoppingCart, Loader2, BookOpen, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAuthStore } from '@/store/auth'
import { orderApi, ApiError } from '@/lib/api'
import type { Order } from '@/types/order'

const STATUS_LABEL: Record<string, string> = {
  pending:   '결제 대기',
  paid:      '결제 완료',
  cancelled: '취소됨',
  refunded:  '환불됨',
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending:   'outline',
  paid:      'default',
  cancelled: 'secondary',
  refunded:  'secondary',
}

export default function MyOrdersPage() {
  const router = useRouter()
  const { token, isLoaded } = useAuthStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<number | null>(null)

  useEffect(() => {
    if (!isLoaded) return
    if (!token) {
      router.push('/login?return_url=/my/orders')
      return
    }
    orderApi.myList(token).then(setOrders).finally(() => setLoading(false))
  }, [isLoaded, token, router])

  const handleCancel = async (order: Order) => {
    if (!token) return
    if (!confirm(`주문 ${order.order_no}을 취소하시겠습니까?\n취소 후 환불 처리됩니다.`)) return

    setCancellingId(order.id)
    try {
      await orderApi.cancel(token, order.id)
      toast.success('취소 및 환불이 완료되었습니다.')
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id ? { ...o, status: 'refunded', cancelled_at: new Date().toISOString() } : o,
        ),
      )
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message)
      else toast.error('취소 처리 중 오류가 발생했습니다.')
    } finally {
      setCancellingId(null)
    }
  }

  if (!isLoaded || loading) {
    return (
      <div className="flex h-60 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <ShoppingCart className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-xl font-semibold">주문 내역</h1>
          <p className="text-sm text-muted-foreground">결제 및 취소 내역을 확인합니다.</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <ShoppingCart className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground">주문 내역이 없습니다.</p>
          <Button variant="outline" size="sm" className="mt-4" asChild>
            <Link href="/courses">강좌 둘러보기</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-lg border bg-card p-5 space-y-4"
            >
              {/* 주문 헤더 */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground font-mono">{order.order_no}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {new Date(order.created_at).toLocaleString('ko-KR')}
                  </p>
                </div>
                <Badge variant={STATUS_VARIANT[order.status] ?? 'outline'}>
                  {STATUS_LABEL[order.status] ?? order.status}
                </Badge>
              </div>

              <Separator />

              {/* 강좌 정보 */}
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center shrink-0">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {order.course?.title ?? '(강좌 정보 없음)'}
                  </p>
                  <p className="text-sm font-bold text-primary mt-0.5">
                    ₩{order.amount.toLocaleString('ko-KR')}
                  </p>
                </div>
              </div>

              {/* 결제 시각 */}
              {order.paid_at && (
                <p className="text-xs text-muted-foreground">
                  결제일시: {new Date(order.paid_at).toLocaleString('ko-KR')}
                </p>
              )}
              {order.cancelled_at && (
                <p className="text-xs text-muted-foreground">
                  취소일시: {new Date(order.cancelled_at).toLocaleString('ko-KR')}
                </p>
              )}

              {/* 액션 */}
              <div className="flex gap-2 pt-1">
                {order.status === 'paid' && order.course && (
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/courses/${order.course.slug}`}>
                      <BookOpen className="mr-1 h-3.5 w-3.5" />
                      강좌 보기
                    </Link>
                  </Button>
                )}
                {order.status === 'paid' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    disabled={cancellingId === order.id}
                    onClick={() => handleCancel(order)}
                  >
                    {cancellingId === order.id ? (
                      <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="mr-1 h-3.5 w-3.5" />
                    )}
                    취소/환불
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
