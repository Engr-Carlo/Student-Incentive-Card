// Shared store - same storage key as Student portal for data sharing
export type CardStatus = 'Unused' | 'Redeemed'
export type Tier = 'Gold' | 'Silver' | 'Bronze'
export type RequestStatus = 'Pending' | 'Approved' | 'Denied'

export interface Card {
  id: string
  studentId: string
  studentName: string
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
  status: RequestStatus
  submittedDate: string
  approvedDate?: string
}

export interface ProofSubmission {
  id: string
  studentId: string
  studentName: string
  eventName: string
  eventType: string
  files: string[]
  status: RequestStatus
  submittedDate: string
  approvedDate?: string
}

class AdminStore {
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

  // Cards
  getCards(): Card[] {
    return this.loadFromStorage('cards', [])
  }

  issueCard(studentId: string, studentName: string, event: string, tier: Tier): Card {
    const cards = this.getCards()
    const newCard: Card = {
      id: `card-${Date.now()}`,
      studentId,
      studentName,
      event,
      tier,
      benefits: this.getBenefitsByTier(tier),
      status: 'Unused',
      issuedDate: new Date().toISOString().split('T')[0],
      qrCode: `qr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
    cards.push(newCard)
    this.saveToStorage('cards', cards)
    return newCard
  }

  private getBenefitsByTier(tier: Tier): string[] {
    if (tier === 'Gold') return ['1 Quiz Exemption', '1 Activity Exemption', '+2 Pts in Exam']
    if (tier === 'Silver') return ['1 Quiz Exemption', '1 Activity Exemption']
    return ['1 Activity Exemption']
  }

  // Redemption Requests
  getRedemptionRequests(): RedemptionRequest[] {
    return this.loadFromStorage('requests', [])
  }

  approveRequest(requestId: string): void {
    const requests = this.getRedemptionRequests()
    const request = requests.find(r => r.id === requestId)
    if (request) {
      request.status = 'Approved'
      request.approvedDate = new Date().toISOString().split('T')[0]
      
      // Mark card as redeemed
      const cards = this.getCards()
      const card = cards.find(c => c.id === request.cardId)
      if (card) {
        card.status = 'Redeemed'
        card.redeemedDate = request.approvedDate
        this.saveToStorage('cards', cards)
      }
      
      this.saveToStorage('requests', requests)
    }
  }

  denyRequest(requestId: string): void {
    const requests = this.getRedemptionRequests()
    const request = requests.find(r => r.id === requestId)
    if (request) {
      request.status = 'Denied'
      this.saveToStorage('requests', requests)
    }
  }

  // Proof Submissions
  getProofSubmissions(): ProofSubmission[] {
    return this.loadFromStorage('proofs', [])
  }

  approveProof(proofId: string, studentId: string, studentName: string, tier: Tier): Card | null {
    const proofs = this.getProofSubmissions()
    const proof = proofs.find(p => p.id === proofId)
    if (proof) {
      proof.status = 'Approved'
      proof.approvedDate = new Date().toISOString().split('T')[0]
      this.saveToStorage('proofs', proofs)
      
      // Issue a card for approved proof
      return this.issueCard(studentId, studentName, proof.eventName, tier)
    }
    return null
  }

  denyProof(proofId: string): void {
    const proofs = this.getProofSubmissions()
    const proof = proofs.find(p => p.id === proofId)
    if (proof) {
      proof.status = 'Denied'
      this.saveToStorage('proofs', proofs)
    }
  }

  // Stats
  getStats() {
    const cards = this.getCards()
    const requests = this.getRedemptionRequests()
    const proofs = this.getProofSubmissions()
    
    const totalCards = cards.length
    const uniqueStudents = new Set(cards.map(c => c.studentId)).size
    const redeemed = cards.filter(c => c.status === 'Redeemed').length
    const pendingRequests = requests.filter(r => r.status === 'Pending').length
    const pendingProofs = proofs.filter(p => p.status === 'Pending').length
    
    return {
      totalCards,
      uniqueStudents,
      redeemed,
      pending: pendingRequests + pendingProofs
    }
  }

  // Recent Activity
  getRecentActivity() {
    const cards = this.getCards()
    const requests = this.getRedemptionRequests()
    const activity = []
    
    // Add recent card issuances
    for (const card of cards.slice(-5)) {
      activity.push({
        action: 'Card Issued',
        student: card.studentName,
        event: card.event,
        time: this.getRelativeTime(card.issuedDate)
      })
    }
    
    // Add recent redemptions
    for (const req of requests.filter(r => r.status === 'Approved').slice(-5)) {
      activity.push({
        action: 'Redemption Approved',
        student: req.studentName,
        course: req.course,
        time: this.getRelativeTime(req.approvedDate || req.submittedDate)
      })
    }
    
    return activity.slice(-5)
  }

  private getRelativeTime(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return dateString
  }
}

export const adminStore = new AdminStore()
