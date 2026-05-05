export type Notice = {
  id: number
  category: string
  title: string
  body: string
  is_pinned: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

export type NoticePaginated = {
  data: Notice[]
  total: number
  current_page: number
  last_page: number
  per_page: number
}

export type FaqItem = {
  id: number
  category: string
  question: string
  answer: string
  order_no: number
  is_published: boolean
}

export type FaqGroup = {
  category: string
  items: FaqItem[]
}
