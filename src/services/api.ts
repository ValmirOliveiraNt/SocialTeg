import {
  AuditLog,
  Business,
  NFCTag,
  Order,
  Plan,
  Product,
  TagDestination,
  TagScan,
  User,
} from '../types'
import type { Analytics } from '../types/analytics'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('avaliatag_session_token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers as Record<string, string> || {}),
  }

  const res = await fetch(url, {
    ...options,
    headers,
  })

  if (!res.ok) {
    let errorMsg = `Erro na requisição (${res.status})`
    try {
      const json = await res.json()
      if (json.error) errorMsg = json.error
    } catch {}
    throw new Error(errorMsg)
  }

  return (await res.json()) as T
}

export const api = {
  analytics: {
    get(days: number, businessId = '', signal?: AbortSignal): Promise<Analytics> {
      const params = new URLSearchParams({ days: String(days) })
      if (businessId) params.set('business_id', businessId)
      return request<Analytics>(`/api/analytics?${params}`, { signal })
    },
  },
  auth: {
    async login(email: string, password = ''): Promise<{ user: User; token: string }> {
      return request<{ user: User; token: string }>('/api/auth', {
        method: 'POST',
        body: JSON.stringify({ action: 'login', email, password }),
      })
    },

    async register(name: string, email: string, phone: string, password = ''): Promise<{ user: User; token: string }> {
      return request<{ user: User; token: string }>('/api/auth', {
        method: 'POST',
        body: JSON.stringify({ action: 'register', name, email, phone, password }),
      })
    },

    async getMe(): Promise<{ user: User }> {
      return request<{ user: User }>('/api/auth', {
        method: 'GET',
      })
    },

    async logout(): Promise<void> {
      try {
        await request('/api/auth', {
          method: 'POST',
          body: JSON.stringify({ action: 'logout' }),
        })
      } catch {}
    },
  },

  users: {
    async getAll(): Promise<User[]> {
      return request<User[]>('/api/users')
    },
    async getById(id: string): Promise<User | null> {
      return request<User | null>(`/api/users?id=${encodeURIComponent(id)}`)
    },
    async update(user: Partial<User>): Promise<User> {
      return request<User>('/api/users', {
        method: 'PUT',
        body: JSON.stringify(user),
      })
    },
  },

  businesses: {
    async getAll(ownerId?: string): Promise<Business[]> {
      const url = ownerId ? `/api/businesses?owner_id=${encodeURIComponent(ownerId)}` : '/api/businesses'
      return request<Business[]>(url)
    },
    async getById(id: string): Promise<Business | null> {
      return request<Business | null>(`/api/businesses?id=${encodeURIComponent(id)}`)
    },
    async save(business: Partial<Business>): Promise<Business> {
      const isNew = !business.id || business.id.startsWith('temp-')
      return request<Business>('/api/businesses', {
        method: isNew ? 'POST' : 'PUT',
        body: JSON.stringify(business),
      })
    },
    async delete(id: string): Promise<{ success: boolean }> {
      return request<{ success: boolean }>(`/api/businesses?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
    },
  },

  tags: {
    async getAll(ownerId?: string): Promise<NFCTag[]> {
      const url = ownerId ? `/api/tags?owner_id=${encodeURIComponent(ownerId)}` : '/api/tags'
      return request<NFCTag[]>(url)
    },
    async getById(id: string): Promise<NFCTag | null> {
      return request<NFCTag | null>(`/api/tags?id=${encodeURIComponent(id)}`)
    },
    async getByPublicId(publicId: string): Promise<NFCTag | null> {
      return request<NFCTag | null>(`/api/tags?public_id=${encodeURIComponent(publicId)}`)
    },
    async identifyByPublicId(publicId: string): Promise<NFCTag | null> {
      return request<NFCTag | null>(`/api/tags?public_id=${encodeURIComponent(publicId)}&include_serial=1`)
    },
    async getBySerial(serial: string): Promise<NFCTag | null> {
      return request<NFCTag | null>(`/api/tags?serial=${encodeURIComponent(serial)}`)
    },
    async save(tag: Partial<NFCTag>): Promise<NFCTag> {
      const isNew = !tag.id
      return request<NFCTag>('/api/tags', {
        method: isNew ? 'POST' : 'PUT',
        body: JSON.stringify(tag),
      })
    },
    async saveBatch(tags: Partial<NFCTag>[]): Promise<{ success: boolean; count: number }> {
      return request<{ success: boolean; count: number }>('/api/tags', {
        method: 'POST',
        body: JSON.stringify(tags),
      })
    },
    async bulkUpdate(payload: {
      ids: string[]
      operation: 'assign' | 'return_to_stock'
      owner_id?: string
      business_id?: string
      location_mode?: 'same' | 'sequence'
      location?: string
      location_prefix?: string
      location_start?: number
    }): Promise<{ success: boolean; count: number }> {
      return request<{ success: boolean; count: number }>('/api/tags', {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
    },
    async delete(id: string): Promise<{ success: boolean }> {
      return request<{ success: boolean }>(`/api/tags?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
    },
  },

  destinations: {
    async getAll(): Promise<TagDestination[]> {
      return request<TagDestination[]>('/api/destinations')
    },
    async getByTagId(tagId: string): Promise<TagDestination | null> {
      const dest = await request<TagDestination | null>(`/api/destinations?tag_id=${encodeURIComponent(tagId)}`)
      if (dest && typeof dest.configuration === 'string') {
        try {
          dest.configuration = JSON.parse(dest.configuration)
        } catch {}
      }
      return dest
    },
    async save(destination: Partial<TagDestination>): Promise<TagDestination> {
      return request<TagDestination>('/api/destinations', {
        method: 'POST',
        body: JSON.stringify(destination),
      })
    },
  },

  scans: {
    async getAll(ownerId?: string, tagId?: string): Promise<TagScan[]> {
      let url = '/api/scans'
      if (tagId) {
        url = `/api/scans?tag_id=${encodeURIComponent(tagId)}`
      } else if (ownerId) {
        url = `/api/scans?owner_id=${encodeURIComponent(ownerId)}`
      }
      return request<TagScan[]>(url)
    },
    async record(
      tagId: string,
      destinationType: string,
      metadata?: {
        event_id?: string
        event_type?: 'page_view' | 'destination_open'
        parent_event_id?: string
        reading_method?: string
        local_time?: string
        local_date?: string
        timezone?: string
        language?: string
        screen?: string
        referrer?: string
      }
    ): Promise<void> {
      try {
        await request('/api/scans', {
          method: 'POST',
          keepalive: true,
          body: JSON.stringify({
            tag_id: tagId,
            telemetry_version: 2,
            destination_type: destinationType,
            ...(metadata || {}),
          }),
        })
      } catch {}
    },
  },

  products: {
    async getAll(): Promise<Product[]> {
      return request<Product[]>('/api/products')
    },
    async save(product: Partial<Product>): Promise<Product> {
      return request<Product>('/api/products', {
        method: product.id ? 'PUT' : 'POST',
        body: JSON.stringify(product),
      })
    },
    async delete(id: string): Promise<{ success: boolean }> {
      return request<{ success: boolean }>(`/api/products?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
    },
  },

  plans: {
    async getAll(): Promise<Plan[]> {
      return request<Plan[]>('/api/plans')
    },
    async update(plan: Partial<Plan>): Promise<void> {
      await request('/api/plans', {
        method: 'PUT',
        body: JSON.stringify(plan),
      })
    },
  },

  orders: {
    async getAll(userId?: string): Promise<Order[]> {
      const url = userId ? `/api/orders?user_id=${encodeURIComponent(userId)}` : '/api/orders'
      return request<Order[]>(url)
    },
    async getById(id: string): Promise<Order | null> {
      return request<Order | null>(`/api/orders?id=${encodeURIComponent(id)}`)
    },
    async create(orderData: any): Promise<{ success: boolean; orderId: string; assignedSerials: string[] }> {
      return request<{ success: boolean; orderId: string; assignedSerials: string[] }>('/api/orders', {
        method: 'POST',
        body: JSON.stringify(orderData),
      })
    },
    async update(orderData: Partial<Order>): Promise<void> {
      await request('/api/orders', {
        method: 'PUT',
        body: JSON.stringify(orderData),
      })
    },
  },

  logs: {
    async getAll(): Promise<AuditLog[]> {
      return request<AuditLog[]>('/api/logs')
    },
    async add(log: Partial<AuditLog>): Promise<void> {
      try {
        await request('/api/logs', {
          method: 'POST',
          body: JSON.stringify(log),
        })
      } catch {}
    },
  },
}
