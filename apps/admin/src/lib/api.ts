let API_URL = import.meta.env.VITE_API_URL || 'https://incentive-card-backend.vercel.app'
// Ensure protocol present and remove trailing slash for consistency
if (!/^https?:\/\//.test(API_URL)) {
  API_URL = `https://${API_URL}`
}
API_URL = API_URL.replace(/\/$/, '')

// Admin Interface
export interface Admin {
  id: number
  email: string
  first_name: string
  last_name: string
  role: 'super_admin' | 'admin'
  is_active?: boolean
  created_at?: string
}

// Package Interface
export interface Package {
  id: number
  name: string
  tier: 'Bronze' | 'Silver' | 'Gold'
  benefits: string[]
  event_type: string
  competition_level: string
  created_by?: number
  is_active?: boolean
  created_at?: string
}

// Card Interface
export interface Card {
  id: number
  package_id: number
  student_id: string
  issued_by?: number
  status: 'Unused' | 'Redeemed'
  issued_date: string
  redeemed_date?: string
  package_name?: string
  tier?: string
  benefits?: string[]
  event_type?: string
  competition_level?: string
}

// Package Access Interface
export interface PackageAccess {
  id: number
  admin_id: number
  package_id: number
  granted_by: number
  created_at: string
}

// Get auth token
function getToken(): string | null {
  return localStorage.getItem('admin_token')
}

// Get auth headers
function getHeaders(): HeadersInit {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  }
}

class AdminStore {
  // ========== AUTHENTICATION ==========
  
  async login(email: string, password: string): Promise<{ token: string; admin: Admin }> {
    const res = await fetch(`${API_URL}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Login failed')
    }
    
    const data = await res.json()
    localStorage.setItem('admin_token', data.token)
    localStorage.setItem('admin', JSON.stringify(data.admin))
    return data
  }

  logout(): void {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin')
  }

  getCurrentAdmin(): Admin | null {
    const adminStr = localStorage.getItem('admin')
    return adminStr ? JSON.parse(adminStr) : null
  }

  isAuthenticated(): boolean {
    return !!getToken()
  }

  isSuperAdmin(): boolean {
    const admin = this.getCurrentAdmin()
    return admin?.role === 'super_admin'
  }

  // ========== ADMIN MANAGEMENT (Super Admin Only) ==========
  
  async getAllAdmins(): Promise<Admin[]> {
    const res = await fetch(`${API_URL}/api/admin/admins`, {
      headers: getHeaders()
    })
    
    if (!res.ok) throw new Error('Failed to fetch admins')
    return res.json()
  }

  async createAdmin(email: string, password: string, first_name: string, last_name: string, role: 'super_admin' | 'admin' = 'admin'): Promise<Admin> {
    const res = await fetch(`${API_URL}/api/admin/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password, first_name, last_name, role })
    })
    
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Failed to create admin')
    }
    
    const data = await res.json()
    return data.admin
  }

  async grantPackageAccess(admin_id: number, package_id: number): Promise<void> {
    const res = await fetch(`${API_URL}/api/admin/package-access`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ admin_id, package_id })
    })
    
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Failed to grant access')
    }
  }

  async revokePackageAccess(admin_id: number, package_id: number): Promise<void> {
    const res = await fetch(`${API_URL}/api/admin/package-access/${admin_id}/${package_id}`, {
      method: 'DELETE',
      headers: getHeaders()
    })
    
    if (!res.ok) throw new Error('Failed to revoke access')
  }

  async getAdminPackageAccess(admin_id: number): Promise<Package[]> {
    const res = await fetch(`${API_URL}/api/admin/package-access/${admin_id}`, {
      headers: getHeaders()
    })
    
    if (!res.ok) throw new Error('Failed to fetch package access')
    return res.json()
  }

  async deleteAdmin(admin_id: number): Promise<void> {
    const res = await fetch(`${API_URL}/api/admin/admins/${admin_id}`, {
      method: 'DELETE',
      headers: getHeaders()
    })
    
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Failed to delete admin')
    }
  }

  // ========== PACKAGES ==========
  
  async getPackages(): Promise<Package[]> {
    const res = await fetch(`${API_URL}/api/packages`, {
      headers: getHeaders()
    })
    
    if (!res.ok) throw new Error('Failed to fetch packages')
    return res.json()
  }

  async createPackage(name: string, tier: 'Bronze' | 'Silver' | 'Gold', event_type: string, competition_level: string, benefits: string[]): Promise<Package> {
    const res = await fetch(`${API_URL}/api/packages`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, tier, event_type, competition_level, benefits })
    })
    
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Failed to create package')
    }
    
    return res.json()
  }

  // ========== CARDS ==========
  
  async getCards(): Promise<Card[]> {
    const res = await fetch(`${API_URL}/api/cards`, {
      headers: getHeaders()
    })
    
    if (!res.ok) throw new Error('Failed to fetch cards')
    return res.json()
  }

  async issueCard(package_id: number, student_id: string): Promise<Card> {
    const res = await fetch(`${API_URL}/api/cards/issue`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ package_id, student_id })
    })
    
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Failed to issue card')
    }
    
    return res.json()
  }

  // ========== STATS ==========
  
  async getStats(): Promise<{ totalCards: number; uniqueStudents: number; redeemed: number; pending: number }> {
    const res = await fetch(`${API_URL}/api/stats`, {
      headers: getHeaders()
    })
    const data = await res.json()
    return {
      totalCards: parseInt(data.total_cards) || 0,
      uniqueStudents: parseInt(data.total_students) || 0,
      redeemed: parseInt(data.used_cards) || 0,
      pending: 0
    }
  }

  async getRecentActivity(): Promise<Array<{ id: string; type: string; description: string; timestamp: string }>> {
    // For now, return empty array - can be implemented later if needed
    return []
  }

  private formatDate(date: string): string {
    const d = new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return '1 day ago'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return `${Math.floor(diffDays / 30)} months ago`
  }
}

export const adminStore = new AdminStore()

export const adminApi = {
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    if (!response.ok) throw new Error('Login failed')
    return response.json()
  },
  
  // ...rest of the existing code...
}

