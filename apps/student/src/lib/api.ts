const API_BASE_URL = 'http://localhost:3001/api'

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
    const res = await fetch(`${API_BASE_URL}/cards?student_id=${student.id}`)
    return res.json()
  }

  async getCardById(id: number): Promise<Card | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/cards/${id}`)
      return res.json()
    } catch {
      return null
    }
  }

  // Redemption Requests
  async getRedemptionRequests(): Promise<RedemptionRequest[]> {
    const student = getAuthenticatedStudent()
    const res = await fetch(`${API_BASE_URL}/requests?student_id=${student.id}`)
    return res.json()
  }

  async submitRedemptionRequest(cardId: number, course: string, benefit: string): Promise<RedemptionRequest> {
    const student = getAuthenticatedStudent()
    const res = await fetch(`${API_BASE_URL}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        card_id: cardId,
        student_id: student.id,
        student_name: student.name,
        course,
        benefit
      })
    })
    return res.json()
  }

  // Proof Submissions
  async getProofSubmissions(): Promise<ProofSubmission[]> {
    const student = getAuthenticatedStudent()
    const res = await fetch(`${API_BASE_URL}/proofs?student_id=${student.id}`)
    return res.json()
  }

  async submitProof(eventName: string, eventType: string, files: string[]): Promise<ProofSubmission> {
    const student = getAuthenticatedStudent()
    const res = await fetch(`${API_BASE_URL}/proofs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: student.id,
        student_name: student.name,
        event_name: eventName,
        event_type: eventType,
        files
      })
    })
    return res.json()
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
