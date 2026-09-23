export type UserRole = 'admin' | 'customer'
export type UserStatus = 'active' | 'blocked'

export interface User {
  id: string
  name: string
  email: string
  phone: string
  avatar?: string
  role: UserRole
  status: UserStatus
  plan_id?: string
  created_at: string
  updated_at: string
}

export interface Business {
  id: string
  owner_id: string
  name: string
  description: string
  logo_url: string
  cover_url?: string
  phone: string
  email: string
  website?: string
  address: string
  city: string
  state: string
  country: string
  menuUrl?: string
  googleReviewsUrl?: string
  instagramUrl?: string
  menu_url?: string
  google_reviews_url?: string
  instagram_url?: string
  default_destination_type?: DestinationType
  default_target_url?: string
  default_destination_configuration?: DestinationConfig
  created_at: string
  updated_at: string
}

export type TagStatus =
  | 'available'
  | 'reserved'
  | 'sold'
  | 'pending_activation'
  | 'active'
  | 'inactive'
  | 'blocked'
  | 'lost'

export type TagAccessStatus =
  | 'active'
  | 'legacy_active'
  | 'past_due_grace'
  | 'subscription_suspended'

export type DestinationType =
  | 'google_review'
  | 'instagram'
  | 'whatsapp'
  | 'website'
  | 'contact'
  | 'address'
  | 'ifood'
  | 'youtube'
  | 'custom_url'

export interface DestinationConfig {
  direct_redirect: boolean
  page_template?: 'classic' | 'modern' | 'elegant'
  welcome_title?: string
  welcome_message?: string
  primary_color?: string
  star_rating_incentive?: boolean
  custom_logo?: string
  instagram_handle?: string
  instagram_url?: string
  instagram_enabled?: boolean
  google_url?: string
  google_enabled?: boolean
  whatsapp_number?: string
  whatsapp_message?: string
  whatsapp_url?: string
  whatsapp_enabled?: boolean
  menu_url?: string
  menu_enabled?: boolean
  contact_url?: string
  contact_enabled?: boolean
  address_url?: string
  address_enabled?: boolean
  ifood_url?: string
  ifood_enabled?: boolean
  youtube_url?: string
  youtube_enabled?: boolean
  custom_url?: string
  custom_label?: string
  custom_enabled?: boolean
  [key: string]: any
}

export interface TagDestination {
  id: string
  tag_id: string
  type: DestinationType
  title: string
  target_url: string
  configuration: DestinationConfig
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface NFCTag {
  id: string
  public_id: string
  serial_number: string
  uid?: string
  product_id?: string
  status: TagStatus
  owner_id?: string
  business_id?: string
  configuration_mode?: 'business' | 'custom'
  business?: Business
  name: string
  location?: string
  activated_at?: string
  created_at: string
  updated_at: string
  access_status?: TagAccessStatus
  subscription_status?: SubscriptionStatus
  access_until?: string
}

export interface TagScan {
  id: string
  tag_id: string
  scanned_at: string
  destination_type: DestinationType
  device_type: string
  operating_system: string
  browser: string
  country?: string
  region?: string
  location_precision?: 'ip_city' | 'ip_state' | string
  referrer?: string
  tag_name?: string
  tag_location?: string
  serial_number?: string
  local_time?: string
  local_date?: string
  timezone?: string
  reading_method?: 'nfc' | 'qr' | 'direct' | string
  screen_resolution?: string
  language?: string
}

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
export type PaymentStatus = 'pending' | 'approved' | 'failed' | 'refunded'
export type PaymentMethod = 'pix' | 'credit_card' | 'boleto'

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  total: number
}

export interface Order {
  id: string
  user_id: string
  user_name: string
  user_email: string
  status: OrderStatus
  subtotal: number
  discount: number
  shipping: number
  total: number
  payment_status: PaymentStatus
  payment_method: PaymentMethod
  shipping_address: {
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
    zip: string
  }
  tracking_code?: string
  created_at: string
  updated_at: string
  items: OrderItem[]
  assigned_serials?: string[]
}

export interface Product {
  id: string
  name: string
  description: string
  image: string
  price: number
  stock: number
  status: 'active' | 'inactive'
  features: string[]
  created_at: string
  updated_at: string
}

export interface Plan {
  id: string
  name: string
  description: string
  price: number
  billing_interval: 'monthly' | 'yearly' | 'lifetime'
  max_tags: number
  max_businesses: number
  analytics_enabled: boolean
  advanced_analytics: boolean
  status: 'active' | 'inactive'
  popular?: boolean
  features: string[]
}

export interface Subscription {
  id: string
  user_id: string
  plan_id: string
  provider: string
  provider_subscription_id?: string
  status: SubscriptionStatus
  started_at: string
  current_period_start?: string
  current_period_end?: string
  next_billing_at?: string
  grace_period_ends_at?: string
  cancel_at_period_end?: boolean
  canceled_at?: string
  ended_at?: string
  payment_method_brand?: string
  payment_method_last4?: string
  billing_method?: 'qr_code' | 'pix_automatico'
  collection_status?: CollectionStatus
  collection_requested_at?: string
  returned_at?: string
  expires_at?: string
  created_at: string
  updated_at?: string
}

export interface PlateOrder {
  id: string
  user_id: string
  business_id: string
  business_name?: string
  user_name?: string
  user_email?: string
  mode: 'subscription' | 'outright'
  quantity: number
  has_custom_logo: boolean
  ownership: 'avaliatag' | 'customer'
  requires_return: boolean
  digital_access: 'full_subscription' | 'fixed_destination'
  fixed_destination_url?: string
  unit_price: number
  customization_total: number
  total: number
  status: string
  payment_status: string
  pix_code?: string
  tracking_code?: string
  assigned_serials: string[]
  created_at: string
}

export type SubscriptionStatus =
  | 'pending'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'expired'
  | 'trialing'

export type CollectionStatus =
  | 'not_required'
  | 'pending'
  | 'scheduled'
  | 'collected'
  | 'not_returned'

export interface AuditLog {
  id: string
  user_id?: string
  user_email?: string
  action: string
  entity_type: string
  entity_id: string
  details: string
  ip_address?: string
  created_at: string
}
