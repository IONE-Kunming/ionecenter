export type UserRole = "admin" | "seller" | "buyer"

export type OrderStatus = "draft" | "pending" | "processing" | "shipped" | "delivered" | "cancelled"

export type PaymentStatus = "pending" | "deposit_paid" | "paid"

export type PaymentMethod = "alipay" | "wechat" | "bank_transfer" | "card"

export type InvoiceStatus = "issued" | "paid" | "overdue" | "cancelled"

export type MessageType = "text" | "image" | "pdf"

export type NotificationType = "chat" | "order" | "payment" | "system"

export interface User {
  id: string
  clerk_id: string
  email: string
  display_name: string
  role: UserRole
  company: string | null
  phone_number: string | null
  preferred_language: string
  street: string | null
  city: string | null
  state: string | null
  zip: string | null
  country: string | null
  bank_name: string | null
  account_name: string | null
  account_number: string | null
  swift_code: string | null
  bank_branch: string | null
  currency: string
  payment_notes: string | null
  user_code: string | null
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  seller_id: string
  seller_name?: string
  name: string
  model_number: string
  main_category: string
  category: string
  subcategory: string | null
  price_per_meter: number
  description: string | null
  stock: number
  stock_status: string
  image_url: string | null
  additional_images: string[] | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  buyer_id: string
  seller_id: string
  subtotal: number
  tax: number
  tax_rate: number
  total: number
  deposit_amount: number
  /** Stored as 0–100 (e.g. 30 means 30% deposit) */
  deposit_percentage: number
  remaining_balance: number
  payment_method: PaymentMethod | null
  payment_status: PaymentStatus
  status: OrderStatus
  created_at: string
  updated_at: string
  // Joined data
  buyer?: User
  seller?: User
  items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  name: string
  model_number: string | null
  category: string | null
  quantity: number
  price: number
  price_per_meter: number | null
  image_url: string | null
}

export interface Invoice {
  id: string
  invoice_number: string
  order_id: string | null
  buyer_id: string
  seller_id: string
  subtotal: number
  tax: number
  total: number
  deposit_paid: number
  remaining_balance: number
  payment_terms: string | null
  payment_instructions: Record<string, string> | null
  terms_and_conditions: string[] | null
  status: InvoiceStatus
  due_date: string | null
  paid_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // Joined data
  buyer?: User
  seller?: User
  items?: InvoiceItem[]
  order?: Order
}

export interface InvoiceItem {
  id: string
  invoice_id: string
  name: string
  quantity: number
  unit: string | null
  price: number
  subtotal: number
}

export interface CartItem {
  product_id: string
  quantity: number
  price: number
}

export interface Cart {
  user_id: string
  items: CartItem[]
  updated_at: string
}

export interface Conversation {
  id: string
  listing_id: string | null
  buyer_id: string
  seller_id: string
  last_message: string | null
  last_message_at: string | null
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  text: string | null
  type: MessageType
  file_url: string | null
  file_name: string | null
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  sender_id: string | null
  created_at: string
}

export interface Branch {
  id: string
  seller_id: string
  name: string
  address: string
  city: string
  state: string | null
  country: string
  phone: string | null
  email: string | null
  created_at: string
  updated_at: string
}

export interface SupportTicket {
  id: string
  user_id: string
  type: string | null
  subject: string
  message: string
  status: string
  created_at: string
  updated_at: string
}

export interface DashboardStats {
  totalOrders: number
  totalRevenue: number
  totalProducts: number
  totalUsers: number
  recentOrders: Order[]
}
