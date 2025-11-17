import { useState, useEffect } from 'react'
import { adminStore, Card, Package, Admin } from '../lib/api'
import { Trash2, Edit2, Check, X } from 'lucide-react'

interface Student {
  id: number
  student_id: string
  email: string
  first_name: string
  last_name: string
  program: string
  year_level: string
  is_active: boolean
  created_at: string
}

interface CardWithDetails extends Card {
  student_name?: string
  admin_name?: string
}

interface EditingStudent {
  id: number
  first_name: string
  last_name: string
  email: string
  program: string
  year_level: string
}

interface EditingPackage {
  id: number
  name: string
  tier: string
  event_type: string
  competition_level: string
  benefits: string[]
}

export function ViewData() {
  const [activeTab, setActiveTab] = useState<'students' | 'cards' | 'packages' | 'admins'>('students')
  const [students, setStudents] = useState<Student[]>([])
  const [cards, setCards] = useState<CardWithDetails[]>([])
  const [packages, setPackages] = useState<Package[]>([])
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const isSuperAdmin = adminStore.isSuperAdmin()
  
  const [editingStudent, setEditingStudent] = useState<EditingStudent | null>(null)
  const [editingPackage, setEditingPackage] = useState<EditingPackage | null>(null)

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    setLoading(true)
    setError('')

    try {
      switch (activeTab) {
        case 'students':
          await loadStudents()
          break
        case 'cards':
          await loadCards()
          break
        case 'packages':
          await loadPackages()
          break
        case 'admins':
          await loadAdmins()
          break
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const loadStudents = async () => {
    const response = await fetch('http://localhost:3001/api/admin/students', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
      }
    })
    if (!response.ok) throw new Error('Failed to fetch students')
    const data = await response.json()
    setStudents(data)
  }

  const loadCards = async () => {
    const response = await fetch('http://localhost:3001/api/admin/cards', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
      }
    })
    if (!response.ok) throw new Error('Failed to fetch cards')
    const data = await response.json()
    setCards(data)
  }

  const loadPackages = async () => {
    const data = await adminStore.getPackages()
    setPackages(data)
  }

  const loadAdmins = async () => {
    const data = await adminStore.getAllAdmins()
    setAdmins(data)
  }

  const handleDeleteStudent = async (studentId: number) => {
    if (!confirm('Are you sure you want to delete this student? This will also delete all their cards.')) return
    
    try {
      const response = await fetch(`http://localhost:3001/api/admin/students/${studentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      })
      if (!response.ok) throw new Error('Failed to delete student')
      await loadStudents()
    } catch (err: any) {
      setError(err.message || 'Failed to delete student')
    }
  }

  const handleDeleteCard = async (cardId: number) => {
    if (!confirm('Are you sure you want to delete this card?')) return
    
    try {
      const response = await fetch(`http://localhost:3001/api/admin/cards/${cardId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      })
      if (!response.ok) throw new Error('Failed to delete card')
      await loadCards()
    } catch (err: any) {
      setError(err.message || 'Failed to delete card')
    }
  }

  const handleDeletePackage = async (packageId: number) => {
    if (!confirm('Are you sure you want to delete this package? This will also delete all cards using this package.')) return
    
    try {
      const response = await fetch(`http://localhost:3001/api/admin/packages/${packageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      })
      if (!response.ok) throw new Error('Failed to delete package')
      await loadPackages()
    } catch (err: any) {
      setError(err.message || 'Failed to delete package')
    }
  }

  const handleToggleStudentStatus = async (studentId: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`http://localhost:3001/api/admin/students/${studentId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: !currentStatus })
      })
      if (!response.ok) throw new Error('Failed to update student status')
      await loadStudents()
    } catch (err: any) {
      setError(err.message || 'Failed to update student status')
    }
  }

  const handleToggleAdminStatus = async (adminId: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`http://localhost:3001/api/admin/admins/${adminId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: !currentStatus })
      })
      if (!response.ok) throw new Error('Failed to update admin status')
      await loadAdmins()
    } catch (err: any) {
      setError(err.message || 'Failed to update admin status')
    }
  }

  const handleEditStudent = (student: Student) => {
    setEditingStudent({
      id: student.id,
      first_name: student.first_name,
      last_name: student.last_name,
      email: student.email,
      program: student.program,
      year_level: student.year_level
    })
  }

  const handleSaveStudent = async () => {
    if (!editingStudent) return
    
    try {
      const response = await fetch(`http://localhost:3001/api/admin/students/${editingStudent.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          first_name: editingStudent.first_name,
          last_name: editingStudent.last_name,
          email: editingStudent.email,
          program: editingStudent.program,
          year_level: editingStudent.year_level
        })
      })
      if (!response.ok) throw new Error('Failed to update student')
      setEditingStudent(null)
      await loadStudents()
    } catch (err: any) {
      setError(err.message || 'Failed to update student')
    }
  }

  const handleEditPackage = (pkg: Package) => {
    setEditingPackage({
      id: pkg.id,
      name: pkg.name,
      tier: pkg.tier,
      event_type: pkg.event_type,
      competition_level: pkg.competition_level,
      benefits: [...pkg.benefits]
    })
  }

  const handleSavePackage = async () => {
    if (!editingPackage) return
    
    try {
      const response = await fetch(`http://localhost:3001/api/admin/packages/${editingPackage.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editingPackage.name,
          tier: editingPackage.tier,
          event_type: editingPackage.event_type,
          competition_level: editingPackage.competition_level,
          benefits: editingPackage.benefits
        })
      })
      if (!response.ok) throw new Error('Failed to update package')
      setEditingPackage(null)
      await loadPackages()
    } catch (err: any) {
      setError(err.message || 'Failed to update package')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const tabs = [
    { id: 'students' as const, label: 'Students', icon: '👥' },
    { id: 'cards' as const, label: 'Distributed Cards', icon: '🎴' },
    { id: 'packages' as const, label: 'Packages', icon: '📦' },
    { id: 'admins' as const, label: 'Administrators', icon: '👤' }
  ]

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Database Records</h1>
        <p className="text-gray-600">View all system data in organized tables</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-semibold transition-all duration-200 border-b-2 ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading data...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Students Table */}
          {activeTab === 'students' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year Level</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
                    {isSuperAdmin && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.student_id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {editingStudent?.id === student.id ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={editingStudent.first_name}
                              onChange={(e) => setEditingStudent({...editingStudent, first_name: e.target.value})}
                              className="border rounded px-2 py-1 w-24"
                            />
                            <input
                              type="text"
                              value={editingStudent.last_name}
                              onChange={(e) => setEditingStudent({...editingStudent, last_name: e.target.value})}
                              className="border rounded px-2 py-1 w-24"
                            />
                          </div>
                        ) : (
                          `${student.first_name} ${student.last_name}`
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {editingStudent?.id === student.id ? (
                          <input
                            type="email"
                            value={editingStudent.email}
                            onChange={(e) => setEditingStudent({...editingStudent, email: e.target.value})}
                            className="border rounded px-2 py-1 w-full"
                          />
                        ) : (
                          student.email
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {editingStudent?.id === student.id ? (
                          <input
                            type="text"
                            value={editingStudent.program}
                            onChange={(e) => setEditingStudent({...editingStudent, program: e.target.value})}
                            className="border rounded px-2 py-1 w-full"
                          />
                        ) : (
                          student.program
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {editingStudent?.id === student.id ? (
                          <input
                            type="text"
                            value={editingStudent.year_level}
                            onChange={(e) => setEditingStudent({...editingStudent, year_level: e.target.value})}
                            className="border rounded px-2 py-1 w-20"
                          />
                        ) : (
                          student.year_level
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isSuperAdmin ? (
                          <button
                            onClick={() => handleToggleStudentStatus(student.id, student.is_active)}
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer transition-colors ${
                              student.is_active 
                                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                          >
                            {student.is_active ? 'Active' : 'Inactive'}
                          </button>
                        ) : (
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            student.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {student.is_active ? 'Active' : 'Inactive'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(student.created_at)}</td>
                      {isSuperAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-2">
                            {editingStudent?.id === student.id ? (
                              <>
                                <button
                                  onClick={handleSaveStudent}
                                  className="text-green-600 hover:text-green-800 transition-colors"
                                  title="Save changes"
                                >
                                  <Check size={18} />
                                </button>
                                <button
                                  onClick={() => setEditingStudent(null)}
                                  className="text-gray-600 hover:text-gray-800 transition-colors"
                                  title="Cancel"
                                >
                                  <X size={18} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleEditStudent(student)}
                                  className="text-blue-600 hover:text-blue-800 transition-colors"
                                  title="Edit student"
                                >
                                  <Edit2 size={18} />
                                </button>
                                <button
                                  onClick={() => handleDeleteStudent(student.id)}
                                  className="text-red-600 hover:text-red-800 transition-colors"
                                  title="Delete student"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {students.length === 0 && (
                <div className="text-center py-12 text-gray-500">No students registered yet</div>
              )}
            </div>
          )}

          {/* Cards Table */}
          {activeTab === 'cards' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Card ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Package</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tier</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issued Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issued By</th>
                    {isSuperAdmin && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cards.map((card) => (
                    <tr key={card.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{card.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{card.student_id}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{card.package_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          card.tier === 'Gold' ? 'bg-yellow-100 text-yellow-800' :
                          card.tier === 'Silver' ? 'bg-gray-100 text-gray-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {card.tier}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          card.status === 'Unused' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {card.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(card.issued_date)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{card.admin_name || `Admin #${card.issued_by || 'N/A'}`}</td>
                      {isSuperAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleDeleteCard(card.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Delete card"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {cards.length === 0 && (
                <div className="text-center py-12 text-gray-500">No cards distributed yet</div>
              )}
            </div>
          )}

          {/* Packages Table */}
          {activeTab === 'packages' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Package ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tier</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Benefits</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    {isSuperAdmin && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {packages.map((pkg) => (
                    <tr key={pkg.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{pkg.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {editingPackage?.id === pkg.id ? (
                          <input
                            type="text"
                            value={editingPackage.name}
                            onChange={(e) => setEditingPackage({...editingPackage, name: e.target.value})}
                            className="border rounded px-2 py-1 w-full"
                          />
                        ) : (
                          pkg.name
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingPackage?.id === pkg.id ? (
                          <select
                            value={editingPackage.tier}
                            onChange={(e) => setEditingPackage({...editingPackage, tier: e.target.value})}
                            className="border rounded px-2 py-1"
                          >
                            <option value="Gold">Gold</option>
                            <option value="Silver">Silver</option>
                            <option value="Bronze">Bronze</option>
                          </select>
                        ) : (
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            pkg.tier === 'Gold' ? 'bg-yellow-100 text-yellow-800' :
                            pkg.tier === 'Silver' ? 'bg-gray-100 text-gray-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            {pkg.tier}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {editingPackage?.id === pkg.id ? (
                          <input
                            type="text"
                            value={editingPackage.event_type}
                            onChange={(e) => setEditingPackage({...editingPackage, event_type: e.target.value})}
                            className="border rounded px-2 py-1 w-full"
                          />
                        ) : (
                          pkg.event_type
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {editingPackage?.id === pkg.id ? (
                          <input
                            type="text"
                            value={editingPackage.competition_level}
                            onChange={(e) => setEditingPackage({...editingPackage, competition_level: e.target.value})}
                            className="border rounded px-2 py-1 w-full"
                          />
                        ) : (
                          pkg.competition_level
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {editingPackage?.id === pkg.id ? (
                          <div className="space-y-1">
                            {editingPackage.benefits.map((benefit, idx) => (
                              <div key={idx} className="flex gap-1">
                                <input
                                  type="text"
                                  value={benefit}
                                  onChange={(e) => {
                                    const newBenefits = [...editingPackage.benefits]
                                    newBenefits[idx] = e.target.value
                                    setEditingPackage({...editingPackage, benefits: newBenefits})
                                  }}
                                  className="border rounded px-2 py-1 flex-1 text-xs"
                                />
                                <button
                                  onClick={() => {
                                    const newBenefits = editingPackage.benefits.filter((_, i) => i !== idx)
                                    setEditingPackage({...editingPackage, benefits: newBenefits})
                                  }}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={() => setEditingPackage({...editingPackage, benefits: [...editingPackage.benefits, '']})}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              + Add Benefit
                            </button>
                          </div>
                        ) : (
                          <ul className="list-disc list-inside">
                            {pkg.benefits.map((benefit, idx) => (
                              <li key={idx}>{benefit}</li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{pkg.created_at ? formatDate(pkg.created_at) : 'N/A'}</td>
                      {isSuperAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-2">
                            {editingPackage?.id === pkg.id ? (
                              <>
                                <button
                                  onClick={handleSavePackage}
                                  className="text-green-600 hover:text-green-800 transition-colors"
                                  title="Save changes"
                                >
                                  <Check size={18} />
                                </button>
                                <button
                                  onClick={() => setEditingPackage(null)}
                                  className="text-gray-600 hover:text-gray-800 transition-colors"
                                  title="Cancel"
                                >
                                  <X size={18} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleEditPackage(pkg)}
                                  className="text-blue-600 hover:text-blue-800 transition-colors"
                                  title="Edit package"
                                >
                                  <Edit2 size={18} />
                                </button>
                                <button
                                  onClick={() => handleDeletePackage(pkg.id)}
                                  className="text-red-600 hover:text-red-800 transition-colors"
                                  title="Delete package"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {packages.length === 0 && (
                <div className="text-center py-12 text-gray-500">No packages created yet</div>
              )}
            </div>
          )}

          {/* Admins Table */}
          {activeTab === 'admins' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    {isSuperAdmin && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {admins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{admin.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{admin.first_name} {admin.last_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{admin.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          admin.role === 'super_admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isSuperAdmin && admin.role !== 'super_admin' ? (
                          <button
                            onClick={() => handleToggleAdminStatus(admin.id, admin.is_active ?? false)}
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer transition-colors ${
                              admin.is_active 
                                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                          >
                            {admin.is_active ? 'Active' : 'Inactive'}
                          </button>
                        ) : (
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            admin.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {admin.is_active ? 'Active' : 'Inactive'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{admin.created_at ? formatDate(admin.created_at) : 'N/A'}</td>
                      {isSuperAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {admin.role !== 'super_admin' && (
                            <button
                              onClick={() => adminStore.deleteAdmin(admin.id).then(() => loadAdmins())}
                              className="text-red-600 hover:text-red-800 transition-colors"
                              title="Delete admin"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {admins.length === 0 && (
                <div className="text-center py-12 text-gray-500">No administrators found</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
