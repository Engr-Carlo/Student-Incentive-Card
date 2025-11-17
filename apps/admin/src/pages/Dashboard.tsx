import { useEffect, useState } from 'react'
import { CreditCard, Users, CheckCircle, Clock } from 'lucide-react'
import { adminStore } from '../lib/api'

export default function Dashboard(){
  const [stats, setStats] = useState({
    totalCards: 0,
    uniqueStudents: 0,
    redeemed: 0,
    pending: 0
  })
  const [recentActivity, setRecentActivity] = useState<Array<{
    id: string
    type: string
    description: string
    timestamp: string
  }>>([])

  useEffect(() => {
    adminStore.getStats().then(setStats)
    adminStore.getRecentActivity().then(setRecentActivity)
  }, [])

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h2>
        <p className="text-gray-600">Overview of incentive card system</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-600 uppercase">Total Cards</h3>
            <div className="p-2 rounded-lg" style={{backgroundColor: '#003f88'}}>
              <CreditCard size={20} className="text-white" />
            </div>
          </div>
          <p className="text-4xl font-bold text-gray-800">{stats.totalCards}</p>
          <p className="text-xs text-gray-500 mt-2">Issued this semester</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-600 uppercase">Students</h3>
            <div className="p-2 bg-green-600 rounded-lg">
              <Users size={20} className="text-white" />
            </div>
          </div>
          <p className="text-4xl font-bold text-gray-800">{stats.uniqueStudents}</p>
          <p className="text-xs text-gray-500 mt-2">With active cards</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-600 uppercase">Redeemed</h3>
            <div className="p-2 bg-gray-600 rounded-lg">
              <CheckCircle size={20} className="text-white" />
            </div>
          </div>
          <p className="text-4xl font-bold text-gray-800">{stats.redeemed}</p>
          <p className="text-xs text-gray-500 mt-2">Cards redeemed</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-600 uppercase">Pending</h3>
            <div className="p-2 bg-yellow-600 rounded-lg">
              <Clock size={20} className="text-white" />
            </div>
          </div>
          <p className="text-4xl font-bold text-gray-800">{stats.pending}</p>
          <p className="text-xs text-gray-500 mt-2">Awaiting approval</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
        <h3 className="font-bold text-xl mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {recentActivity.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No recent activity</p>
          ) : (
            recentActivity.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div>
                  <p className="font-semibold text-gray-800">{item.type}</p>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
                <span className="text-xs text-gray-500">{item.timestamp}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
