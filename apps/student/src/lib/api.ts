let API_URL = import.meta.env.VITE_API_URL || 'https://incentive-card-backend.vercel.app'
// Normalize: add protocol if missing and strip trailing slash
if (!/^https?:\/\//.test(API_URL)) {
  API_URL = `https://${API_URL}`
}
API_URL = API_URL.replace(/\/$/, '')

export interface Card {
  id: number
  package_id: number
  student_id: string
  status: 'Unused' | 'Redeemed'
  issued_date: string
  redeemed_date?: string
  // Package details (joined from packages table)
  package_name: string
  tier: 'Bronze' | 'Silver' | 'Gold'
  benefits: string[]
  event_type: string
  competition_level: string
}

export interface RedemptionRequest {
  id: number
  card_id: number
  student_id: string
  student_name: string
  course: string
  benefit: string
  status: 'Pending' | 'Approved' | 'Denied'
  submitted_date: string
}

export interface ProofSubmission {
  id: number
  student_id: string
  student_name: string
  event_name: string
  event_type: string
  files: string[]
  status: 'Pending' | 'Approved' | 'Denied'
  submitted_date: string
}

// Get authenticated student info from localStorage
function getAuthenticatedStudent() {
  const studentId = localStorage.getItem('student_id')
  const studentName = localStorage.getItem('student_name')
  
  if (!studentId || !studentName) {
    throw new Error('Not authenticated')
  }
  
  return { id: studentId, name: studentName }
}

class StudentStore {
  // Cards
  async getCards(): Promise<Card[]> {
    const student = getAuthenticatedStudent()
    const res = await fetch(`${API_URL}/api/cards?student_id=${student.id}`)
    return res.json()
  }

  async getCardById(id: number): Promise<Card | null> {
    try {
      // Backend has no /api/cards/:id endpoint; filter from list instead
      const cards = await this.getCards()
      return cards.find(c => c.id === id) || null
    } catch {
      return null
    }
  }

  // Redemption Requests
  async getRedemptionRequests(): Promise<RedemptionRequest[]> {
    const student = getAuthenticatedStudent()
    // Endpoint not implemented in backend; return empty array
    return []
  }

  async submitRedemptionRequest(cardId: number, course: string, benefit: string): Promise<RedemptionRequest> {
    const student = getAuthenticatedStudent()
    // Not supported; simulate a local object
    return {
      id: Date.now(),
      card_id: cardId,
      student_id: student.id,
      student_name: student.name,
      course,
      benefit,
      status: 'Pending',
      submitted_date: new Date().toISOString()
    }
  }

  // Proof Submissions
  async getProofSubmissions(): Promise<ProofSubmission[]> {
    const student = getAuthenticatedStudent()
    // Endpoint not implemented; return empty array
    return []
  }

  async submitProof(eventName: string, eventType: string, files: string[]): Promise<ProofSubmission> {
    const student = getAuthenticatedStudent()
    // Not supported; return a mock submission object
    return {
      id: Date.now(),
      student_id: student.id,
      student_name: student.name,
      event_name: eventName,
      event_type: eventType,
      files,
      status: 'Pending',
      submitted_date: new Date().toISOString()
    }
  }

  // Stats
  async getStats(): Promise<{ total: number; unused: number; redeemed: number; pending: number }> {
    const cards = await this.getCards()

    return {
      total: cards.length,
      unused: cards.filter(c => c.status === 'Unused').length,
      redeemed: cards.filter(c => c.status === 'Redeemed').length,
      pending: 0 // No redemption requests in new system
    }
  }

  // Activity History
  async getActivityHistory(): Promise<Array<{ type: string; description: string; date: string }>> {
    const cards = await this.getCards()

    const activity: Array<{ type: string; description: string; date: string }> = []

    // Recent cards
    cards.slice(0, 10).forEach(card => {
      activity.push({
        type: 'Card Issued',
        description: `${card.tier} tier - ${card.package_name}`,
        date: card.issued_date
      })
    })

    return activity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)
  }
}

export const studentStore = new StudentStore()
