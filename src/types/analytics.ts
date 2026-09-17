export interface Breakdown {
  label: string
  total: number
}
export interface Analytics {
  generated_at: string
  days: number
  timezone: string
  start: string
  end: string
  summary: {
    total: number
    previous: number
    today: number
    active_tags: number
    identified: number
    legacy: number
  }
  timeline: { date: string; total: number }[]
  hours: { hour: number; total: number }[]
  methods: Breakdown[]
  systems: Breakdown[]
  destinations: Breakdown[]
  regions: Breakdown[]
  ranking: {
    id: string
    name: string
    location: string
    business: string
    status: string
    total: number
    last_scan: string | null
  }[]
  recent: {
    id: string
    scanned_at: string
    name: string
    location: string
    operating_system: string
    browser: string
    region: string
    method: string
    destination_type: string
  }[]
  inventory: {
    tags: number
    active: number
    pending: number
    businesses: number
    silent: number
  }
  businesses: { id: string; name: string }[]
  admin: null | {
    customers: number
    active_customers: number
    revenue: number
    previous_revenue: number
    approved: number
    pending_orders: number
    awaiting_shipping: number
    average_ticket: number
    recent_orders: {
      id: string
      user_name: string
      total: number
      payment_status: string
      status: string
      created_at: string
    }[]
  }
}
