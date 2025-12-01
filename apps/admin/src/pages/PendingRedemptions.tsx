import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Clock, User, Gift, Award, Calendar, Check } from 'lucide-react'

interface Redemption {
  id: number
  card_id: number
  student_id: string
  student_name: string
  benefit: string
  package_name: string
  tier: 'Bronze' | 'Silver' | 'Gold'
  redeemed_date: string
  redeemed_by: number
  redeemed_by_name: string
  grade_added: boolean
  grade_added_date?: string
  grade_added_by?: number
  grade_added_by_name?: string
}

export default function PendingRedemptions() {
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [filter, setFilter] = useState<'all' | 'pending'>('pending')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  let raw = import.meta.env.VITE_API_URL || 'https://incentive-card-backend.vercel.app'
  if (!/^https?:\/\//.test(raw)) raw = `https://${raw}`
  const API_URL = raw.replace(/\/$/, '')

  const token = localStorage.getItem('admin_token')

  useEffect(() => {
    fetchRedemptions()
  }, [filter])

  const fetchRedemptions = async () => {
    setLoading(true)
    try {
      const url = filter === 'pending' 
        ? `${API_URL}/api/admin/redemptions?pending=true`
        : `${API_URL}/api/admin/redemptions`
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (!res.ok) throw new Error('Failed to fetch redemptions')
      
      const data = await res.json()
      setRedemptions(data)
    } catch (err) {
      setError('Failed to load redemptions')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkGraded = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/redemptions/${id}/mark-graded`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!res.ok) throw new Error('Failed to mark as graded')
      
      setMessage('Marked as graded successfully')
      setTimeout(() => setMessage(''), 3000)
      fetchRedemptions()
      setSelectedIds(selectedIds.filter(sid => sid !== id))
    } catch (err) {
      setError('Failed to update redemption')
      setTimeout(() => setError(''), 3000)
      console.error(err)
    }
  }

  const handleBulkMarkGraded = async () => {
    if (selectedIds.length === 0) {
      setError('Please select at least one redemption')
      setTimeout(() => setError(''), 3000)
      return
    }

    try {
      const res = await fetch(`${API_URL}/api/admin/redemptions/bulk-mark-graded`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: selectedIds })
      })
      
      if (!res.ok) throw new Error('Failed to mark as graded')
      
      const data = await res.json()
      setMessage(data.message)
      setTimeout(() => setMessage(''), 3000)
      fetchRedemptions()
      setSelectedIds([])
    } catch (err) {
      setError('Failed to update redemptions')
      setTimeout(() => setError(''), 3000)
      console.error(err)
    }
  }

  const toggleSelection = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(sid => sid !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredRedemptions.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredRedemptions.map(r => r.id))
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Gold': return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white'
      case 'Silver': return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white'
      case 'Bronze': return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white'
      default: return 'bg-gray-200 text-gray-800'
    }
  }

  const filteredRedemptions = redemptions

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Redemption Tracking</h1>
          <p className="text-gray-600 mt-1">Track and manage benefit redemptions for grade input</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <button
          onClick={() => setFilter('pending')}
          className={`px-6 py-2 rounded-lg font-semibold transition-all ${
            filter === 'pending'
              ? 'bg-orange-500 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Clock size={18} className="inline mr-2" />
          Pending ({redemptions.filter(r => !r.grade_added).length})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-6 py-2 rounded-lg font-semibold transition-all ${
            filter === 'all'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          All Redemptions ({redemptions.length})
        </button>
      </div>

      {/* Messages */}
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

      {/* Bulk Actions */}
      {filter === 'pending' && filteredRedemptions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIds.length === filteredRedemptions.length}
                onChange={toggleSelectAll}
                className="w-5 h-5 rounded border-gray-300"
              />
              <span className="font-semibold text-gray-700">Select All</span>
            </label>
            {selectedIds.length > 0 && (
              <span className="text-sm text-gray-600">
                {selectedIds.length} selected
              </span>
            )}
          </div>
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkMarkGraded}
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition-all flex items-center gap-2"
            >
              <Check size={18} />
              Mark Selected as Graded
            </button>
          )}
        </div>
      )}

      {/* Redemptions Table */}
      {filteredRedemptions.length === 0 ? (
        <div className="bg-white rounded-xl p-16 text-center shadow-lg">
          <Clock size={80} className="mx-auto text-gray-300 mb-6" />
          <p className="text-gray-500 text-xl font-medium">
            {filter === 'pending' ? 'No pending redemptions' : 'No redemptions found'}
          </p>
          <p className="text-gray-400 text-sm mt-2">
            {filter === 'pending' 
              ? 'All redemptions have been added to grades!' 
              : 'Redemptions will appear here when students redeem benefits'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  {filter === 'pending' && (
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === filteredRedemptions.length}
                        onChange={toggleSelectAll}
                        className="w-5 h-5 rounded border-gray-300"
                      />
                    </th>
                  )}
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                    Package
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                    Benefit
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                    Redeemed
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRedemptions.map((redemption) => (
                  <tr 
                    key={redemption.id} 
                    className={`hover:bg-gray-50 transition-colors ${
                      redemption.grade_added ? 'opacity-60' : ''
                    }`}
                  >
                    {filter === 'pending' && (
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(redemption.id)}
                          onChange={() => toggleSelection(redemption.id)}
                          className="w-5 h-5 rounded border-gray-300"
                        />
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <User size={18} className="text-gray-400" />
                        <div>
                          <div className="font-semibold text-gray-800">{redemption.student_name}</div>
                          <div className="text-sm text-gray-500">{redemption.student_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${getTierColor(redemption.tier)}`}>
                          {redemption.tier}
                        </div>
                        <span className="font-medium text-gray-700">{redemption.package_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Gift size={16} className="text-indigo-500" />
                        <span className="font-medium text-gray-800">{redemption.benefit}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Calendar size={14} />
                          {new Date(redemption.redeemed_date).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          by {redemption.redeemed_by_name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {redemption.grade_added ? (
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1">
                            <CheckCircle size={14} />
                            Graded
                          </span>
                          {redemption.grade_added_date && (
                            <div className="text-xs text-gray-500">
                              {new Date(redemption.grade_added_date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold flex items-center gap-1 w-fit">
                          <Clock size={14} />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {!redemption.grade_added && (
                        <button
                          onClick={() => handleMarkGraded(redemption.id)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-all flex items-center gap-2"
                        >
                          <Check size={16} />
                          Mark as Graded
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
