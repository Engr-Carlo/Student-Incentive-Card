// Simple in-memory store for demo purposes
// Replace with real API calls later

export type CardStatus = 'Unused' | 'Redeemed'
export type Tier = 'Gold' | 'Silver' | 'Bronze'

export interface Card {
  id: string
  studentId?: string
  studentName?: string
  event: string
  tier: Tier
  benefits: string[]
  status: CardStatus
  issuedDate: string
  redeemedDate?: string
  qrCode: string
}

export interface RedemptionRequest {
  id: string
  cardId: string
  studentId: string
  studentName: string
  course: string
  benefit: string
  status: 'Pending' | 'Approved' | 'Denied'
  submittedDate: string
}

export interface ProofSubmission {
  id: string
  studentId: string
  studentName: string
  eventName: string
  eventType: string
  files: string[]
  status: 'Pending' | 'Approved' | 'Denied'
  submittedDate: string
}

class AppStore {
  private storageKey = 'incentive-card-data'

  private loadFromStorage<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue
    const stored = localStorage.getItem(`${this.storageKey}-${key}`)
    return stored ? JSON.parse(stored) : defaultValue
  }

  private saveToStorage<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(`${this.storageKey}-${key}`, JSON.stringify(value))
  }

  private cards: Card[] = this.loadFromStorage('cards', [
    {
      id: '1',
      studentId: '2021-12345',
      studentName: 'Juan Dela Cruz',
      event: 'Programming Competition 2024',
      tier: 'Gold',
      benefits: ['1 Quiz Exemption', '1 Activity Exemption', '+2 Pts in Exam'],
      status: 'Unused',
      issuedDate: '2024-11-10',
      qrCode: 'mock-qr-code-1'
    },
    {
      id: '2',
      studentId: '2021-12345',
      studentName: 'Juan Dela Cruz',
      event: 'Hackathon Winner',
      tier: 'Silver',
      benefits: ['1 Quiz Exemption', '1 Activity Exemption'],
      status: 'Unused',
      issuedDate: '2024-10-15',
      qrCode: 'mock-qr-code-2'
    },
    {
      id: '3',
      studentId: '2021-12345',
      studentName: 'Juan Dela Cruz',
      event: 'Research Presentation',
      tier: 'Bronze',
      benefits: ['1 Activity Exemption'],
      status: 'Redeemed',
      issuedDate: '2024-09-20',
      redeemedDate: '2024-10-01',
      qrCode: 'mock-qr-code-3'
    }
  ])

  private redemptionRequests: RedemptionRequest[] = this.loadFromStorage('requests', [
    {
      id: 'req-1',
      cardId: '3',
      studentId: '2021-12345',
      studentName: 'Juan Dela Cruz',
      course: 'ECE101',
      benefit: 'Activity Exemption',
      status: 'Approved',
      submittedDate: '2024-10-01'
    }
  ])

  private proofSubmissions: ProofSubmission[] = this.loadFromStorage('proofs', [])

  // Cards
  getCards(): Card[] {
    return [...this.cards]
  }

  getCardById(id: string): Card | undefined {
    return this.cards.find(c => c.id === id)
  }

  // Redemption Requests
  getRedemptionRequests(): RedemptionRequest[] {
    return [...this.redemptionRequests]
  }

  submitRedemptionRequest(cardId: string, course: string, benefit: string): RedemptionRequest {
    const card = this.getCardById(cardId)
    const newRequest: RedemptionRequest = {
      id: `req-${Date.now()}`,
      cardId,
      studentId: card?.studentId || '2021-12345',
      studentName: card?.studentName || 'Juan Dela Cruz',
      course,
      benefit,
      status: 'Pending',
      submittedDate: new Date().toISOString().split('T')[0]
    }
    this.redemptionRequests.push(newRequest)
    this.saveToStorage('requests', this.redemptionRequests)
    return newRequest
  }

  // Proof Submissions
  getProofSubmissions(): ProofSubmission[] {
    return [...this.proofSubmissions]
  }

  submitProof(eventName: string, eventType: string, files: string[]): ProofSubmission {
    const newSubmission: ProofSubmission = {
      id: `proof-${Date.now()}`,
      studentId: '2021-12345',
      studentName: 'Juan Dela Cruz',
      eventName,
      eventType,
      files,
      status: 'Pending',
      submittedDate: new Date().toISOString().split('T')[0]
    }
    this.proofSubmissions.push(newSubmission)
    this.saveToStorage('proofs', this.proofSubmissions)
    return newSubmission
  }

  // Stats for Profile
  getStats() {
    const total = this.cards.length
    const unused = this.cards.filter(c => c.status === 'Unused').length
    const redeemed = this.cards.filter(c => c.status === 'Redeemed').length
    const pending = this.redemptionRequests.filter(r => r.status === 'Pending').length
    
    return { total, unused, redeemed, pending }
  }

  // Activity History
  getActivityHistory() {
    const history = []
    
    // Add card issuances
    for (const card of this.cards) {
      history.push({
        id: `card-${card.id}`,
        action: 'Card Issued',
        event: card.event,
        date: card.issuedDate,
        type: 'issued'
      })
    }
    
    // Add redemptions
    for (const req of this.redemptionRequests) {
      const card = this.getCardById(req.cardId)
      history.push({
        id: `req-${req.id}`,
        action: req.status === 'Approved' ? 'Card Redeemed' : 'Request Submitted',
        event: card?.event || 'Unknown Event',
        course: req.course,
        date: req.submittedDate,
        type: req.status === 'Approved' ? 'redeemed' : 'submitted'
      })
    }
    
    // Sort by date descending
    return history.sort((a, b) => b.date.localeCompare(a.date))
  }
}

export const store = new AppStore()
