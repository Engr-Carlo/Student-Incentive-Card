import { useState, useEffect } from 'react'
import { Award, CheckCircle, XCircle, Eye, Sparkles, Gift, Calendar, Star, X, QrCode, Download } from 'lucide-react'
import { studentStore, type Card } from '../lib/api'
import QRCodeLib from 'qrcode'

type Tier = 'Gold' | 'Silver' | 'Bronze'

export default function MyCards(){
  // Build API base URL
  let raw = import.meta.env.VITE_API_URL || 'https://incentive-card-backend.vercel.app'
  if (!/^https?:\/\//.test(raw)) raw = `https://${raw}`
  const API_URL = raw.replace(/\/$/, '')
  
  const [cards, setCards] = useState<Card[]>([])
  const [filter, setFilter] = useState<'all'|'unused'|'redeemed'>('all')
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showRedeemQR, setShowRedeemQR] = useState(false)
  const [qrDataURL, setQrDataURL] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadCards()
  }, [])

  const loadCards = () => {
    studentStore.getCards()
      .then(setCards)
      .catch(err => {
        console.error('Failed to load cards:', err)
        setCards([])
      })
  }

  const handleViewCard = (card: Card) => {
    setSelectedCard(card)
    setShowViewModal(true)
  }

  const handleGenerateRedeemQR = async (card: Card) => {
    try {
      // Generate QR code with card ID
      const qrData = await QRCodeLib.toDataURL(`CARD_${card.id}`, {
        width: 400,
        margin: 2,
        color: {
          dark: '#003f88',
          light: '#FFFFFF'
        }
      })
      setQrDataURL(qrData)
      setSelectedCard(card)
      setShowRedeemQR(true)
    } catch (error) {
      console.error('Error generating QR code:', error)
      setError('Failed to generate QR code')
      setTimeout(() => setError(''), 3000)
    }
  }

  const downloadQR = () => {
    if (!selectedCard) return
    const link = document.createElement('a')
    link.href = qrDataURL
    link.download = `redeem-card-${selectedCard.id}.png`
    link.click()
  }

  const filtered = cards.filter(c => filter === 'all' || c.status.toLowerCase() === filter)

  const getTierClass = (tier: string) => {
    if (tier === 'Gold') return 'gold-gradient text-gray-800'
    if (tier === 'Silver') return 'silver-gradient text-gray-800'
    return 'bronze-gradient text-white'
  }

  return (
    <section className="space-y-6 animate-fadeIn">
      <div className="glass rounded-2xl p-8 shadow-xl border border-white/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent mb-2">
              My Incentive Cards
            </h2>
            <p className="text-gray-600 flex items-center gap-2">
              <Award size={18} className="text-indigo-500" />
              {filtered.length} card{filtered.length !== 1 ? 's' : ''} found
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={()=>setFilter('all')} 
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                filter==='all'
                  ?'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg scale-105'
                  :'glass text-gray-700 hover:shadow-md hover:scale-105'
              }`}
            >All</button>
            <button 
              onClick={()=>setFilter('unused')} 
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                filter==='unused'
                  ?'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg scale-105'
                  :'glass text-gray-700 hover:shadow-md hover:scale-105'
              }`}
            >Unused</button>
            <button 
              onClick={()=>setFilter('redeemed')} 
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                filter==='redeemed'
                  ?'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg scale-105'
                  :'glass text-gray-700 hover:shadow-md hover:scale-105'
              }`}
            >Redeemed</button>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {message && (
        <div className="bg-green-50 border border-green-300 text-green-800 p-4 rounded-xl flex items-center gap-3">
          <CheckCircle size={20} />
          <span className="font-semibold">{message}</span>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-800 p-4 rounded-xl flex items-center gap-3">
          <XCircle size={20} />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center border border-white/20 shadow-xl">
          <XCircle size={80} className="mx-auto text-gray-300 mb-6" />
          <p className="text-gray-500 text-xl font-medium">No cards found.</p>
          <p className="text-gray-400 text-sm mt-2">Try adjusting your filters or participate in more events!</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((card, index) => (
            <div 
              key={card.id} 
              className={`group relative rounded-2xl p-6 shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer animate-slideIn border-2 ${
                card.status === 'Unused' 
                  ? 'bg-gradient-to-br from-white to-green-50 border-green-400 hover:border-green-500' 
                  : 'bg-gradient-to-br from-white to-gray-50 border-gray-300 opacity-90 hover:opacity-100'
              }`}
              style={{animationDelay: `${index * 0.1}s`}}
            >
              {/* Tier badge */}
              <div className="absolute -top-3 -right-3 z-10">
                <div className={`${getTierClass(card.tier)} px-5 py-2 rounded-full text-sm font-bold shadow-xl flex items-center gap-2 ring-4 ring-white`}>
                  <Star size={16} className="fill-current" />
                  {card.tier}
                </div>
              </div>

              {/* Sparkle effect for unused cards */}
              {card.status === 'Unused' && (
                <div className="absolute top-4 left-4">
                  <Sparkles size={20} className="text-green-500 animate-pulse" />
                </div>
              )}

              {/* Status indicator */}
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-3 h-3 rounded-full shadow-lg ${
                  card.status === 'Unused' ? 'bg-green-500 animate-pulse ring-4 ring-green-200' : 'bg-gray-400'
                }`}></div>
                <span className={`text-sm font-bold uppercase tracking-wide ${
                  card.status === 'Unused' ? 'text-green-600' : 'text-gray-500'
                }`}>{card.status}</span>
              </div>
              
              <h3 className="font-bold text-xl mb-4 text-gray-800 line-clamp-2 min-h-[3.5rem]">
                {card.package_name}
              </h3>
              
              {/* Event Info */}
              <div className="bg-white/70 rounded-xl p-3 mb-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Award size={16} className="text-indigo-500" />
                  <span className="font-medium">{card.event_type}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Star size={16} className="text-amber-500" />
                  <span className="font-medium">{card.competition_level}</span>
                </div>
              </div>
              
              {/* Benefits */}
              <div className="mb-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-4 border border-indigo-100">
                <p className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-2 uppercase tracking-wide">
                  <Gift size={16} className="text-indigo-500" />
                  Benefits
                </p>
                <ul className="space-y-2">
                  {card.benefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 font-medium">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Dates */}
              <div className="text-sm text-gray-600 space-y-2 bg-white/70 rounded-xl p-3">
                <p className="flex items-center gap-2">
                  <Calendar size={14} className="text-blue-500" />
                  <span className="font-medium">Issued:</span> {card.issued_date}
                </p>
                {card.redeemed_date && (
                  <p className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-green-500" />
                    Redeemed: {card.redeemed_date}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button 
                  onClick={() => handleViewCard(card)}
                  className="flex-1 text-white text-sm py-2 px-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-1" 
                  style={{backgroundColor: '#003f88'}} 
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#002a5c'} 
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#003f88'}
                >
                  <Eye size={16} />
                  View
                </button>
                {card.status === 'Unused' && (
                  <button 
                    onClick={() => handleGenerateRedeemQR(card)}
                    className="flex-1 bg-green-600 text-white text-sm py-2 px-3 rounded-lg font-medium hover:bg-green-700 transition-all duration-200 flex items-center justify-center gap-1"
                  >
                    <QrCode size={16} />
                    Redeem
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Card Modal */}
      {showViewModal && selectedCard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowViewModal(false)}>
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Card Details</h3>
              <button 
                onClick={() => setShowViewModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            {/* Tier Badge */}
            <div className="mb-6">
              <div className={`inline-flex ${getTierClass(selectedCard.tier)} px-6 py-3 rounded-full text-lg font-bold shadow-xl items-center gap-2`}>
                <Star size={20} className="fill-current" />
                {selectedCard.tier} Tier
              </div>
            </div>

            {/* Card Information */}
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-bold text-gray-800 mb-2">{selectedCard.package_name}</h4>
                <div className={`inline-flex px-4 py-2 rounded-lg text-sm font-bold ${
                  selectedCard.status === 'Unused' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  Status: {selectedCard.status}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-indigo-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-1">Event Type</p>
                  <p className="font-bold text-gray-800">{selectedCard.event_type}</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-1">Competition Level</p>
                  <p className="font-bold text-gray-800">{selectedCard.competition_level}</p>
                </div>
              </div>

              {/* Benefits */}
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-100">
                <h5 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Gift size={20} className="text-indigo-500" />
                  Benefits Included
                </h5>
                <ul className="space-y-3">
                  {selectedCard.benefits.map((b, i) => {
                    const isRedeemed = selectedCard.redeemed_benefits && selectedCard.redeemed_benefits.includes(b)
                    return (
                      <li key={i} className={`flex items-start gap-3 ${isRedeemed ? 'opacity-60' : ''}`}>
                        {isRedeemed ? (
                          <>
                            <XCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-500 font-medium line-through">{b}</span>
                            <span className="ml-auto text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-semibold">Used</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700 font-medium">{b}</span>
                            <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">Available</span>
                          </>
                        )}
                      </li>
                    )
                  })}
                </ul>
                
                {selectedCard.redeemed_benefits && selectedCard.redeemed_benefits.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-indigo-200">
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold text-indigo-700">
                        {selectedCard.benefits.length - selectedCard.redeemed_benefits.length}
                      </span> of <span className="font-semibold">{selectedCard.benefits.length}</span> benefits remaining
                    </p>
                  </div>
                )}
              </div>

              {/* Dates */}
              <div className="bg-gray-50 rounded-xl p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar size={18} className="text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">Issued Date</p>
                    <p className="font-bold text-gray-800">{selectedCard.issued_date}</p>
                  </div>
                </div>
                {selectedCard.redeemed_date && (
                  <div className="flex items-center gap-3">
                    <CheckCircle size={18} className="text-green-500" />
                    <div>
                      <p className="text-sm text-gray-600">Redeemed Date</p>
                      <p className="font-bold text-gray-800">{selectedCard.redeemed_date}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              {selectedCard.status === 'Unused' && (
                <button
                  onClick={() => {
                    setShowViewModal(false)
                    handleGenerateRedeemQR(selectedCard)
                  }}
                  className="w-full bg-green-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-green-700 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <QrCode size={20} />
                  Generate Redeem QR Code
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Redeem QR Code Modal */}
      {showRedeemQR && selectedCard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowRedeemQR(false)}>
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Redeem Card</h3>
              <button 
                onClick={() => setShowRedeemQR(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            <div className="text-center space-y-4">
              <div className={`inline-flex ${getTierClass(selectedCard.tier)} px-6 py-3 rounded-full text-lg font-bold shadow-xl items-center gap-2`}>
                <Star size={20} className="fill-current" />
                {selectedCard.tier} Tier
              </div>

              <h4 className="text-lg font-bold text-gray-800">{selectedCard.package_name}</h4>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200">
                <p className="text-sm text-gray-700 mb-4 font-medium">
                  Show this QR code to an admin to redeem your card
                </p>
                
                <div className="bg-white rounded-xl p-4 shadow-inner">
                  <img src={qrDataURL} alt="Redeem QR Code" className="w-full max-w-[300px] mx-auto" />
                </div>

                <div className="mt-4 p-3 bg-white/80 rounded-lg">
                  <p className="text-xs text-gray-600">Card ID</p>
                  <p className="text-lg font-bold text-gray-800">#{selectedCard.id}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={downloadQR}
                  className="flex-1 py-3 px-4 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2"
                  style={{backgroundColor: '#003f88'}}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#002a5c')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#003f88')}
                >
                  <Download size={20} />
                  Download QR
                </button>
                <button
                  onClick={() => setShowRedeemQR(false)}
                  className="flex-1 py-3 px-4 bg-gray-200 rounded-xl font-semibold text-gray-800 hover:bg-gray-300 transition-all"
                >
                  Close
                </button>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-left">
                <p className="text-xs text-amber-800">
                  <strong>Note:</strong> This card can only be redeemed once. Make sure to show this QR code to an authorized admin.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
