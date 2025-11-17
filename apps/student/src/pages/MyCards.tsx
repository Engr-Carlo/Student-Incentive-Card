import { useState, useEffect } from 'react'
import { Award, CheckCircle, XCircle, Eye, Sparkles, Gift, Calendar, Star } from 'lucide-react'
import { studentStore, type Card } from '../lib/api'

type Tier = 'Gold' | 'Silver' | 'Bronze'

export default function MyCards(){
  const [cards, setCards] = useState<Card[]>([])
  const [filter, setFilter] = useState<'all'|'unused'|'redeemed'>('all')

  useEffect(() => {
    studentStore.getCards()
      .then(setCards)
      .catch(err => {
        console.error('Failed to load cards:', err)
        setCards([])
      })
  }, [])

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
                <button className="flex-1 text-white text-sm py-2 px-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-1" style={{backgroundColor: '#003f88'}} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#002a5c'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#003f88'}>
                  <Eye size={16} />
                  View
                </button>
                {card.status === 'Unused' && (
                  <button className="flex-1 bg-green-600 text-white text-sm py-2 px-3 rounded-lg font-medium hover:bg-green-700 transition-all duration-200 flex items-center justify-center gap-1">
                    <Sparkles size={16} />
                    Redeem
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
