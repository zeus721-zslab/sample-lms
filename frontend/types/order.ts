export type OrderStatus = 'pending' | 'paid' | 'cancelled' | 'refunded'

export type Order = {
  id: number
  user_id: number
  course_id: number | null
  offering_id: number | null
  order_no: string
  amount: number
  status: OrderStatus
  paid_at: string | null
  cancelled_at: string | null
  pg_provider: string | null
  pg_transaction_id: string | null
  created_at: string
  updated_at: string
  course: {
    id: number
    title: string
    slug: string
    course_type: string
    thumbnail: string | null
    price: number
  } | null
}

export type OrderPaginated = {
  data: Order[]
  total: number
  current_page: number
  last_page: number
  per_page: number
}

export type AdminOrder = Order & {
  user: {
    id: number
    name: string
    email: string
  } | null
}

export type AdminOrderPaginated = {
  data: AdminOrder[]
  total: number
  current_page: number
  last_page: number
  per_page: number
}
