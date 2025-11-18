import { useState, useEffect } from 'react'
import { adminStore, Card, Package, Admin } from '../lib/api'
import { Trash2, Edit2, Check, X, Filter, Search } from 'lucide-react'

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

// Build API base URL (matches logic in api.ts)
let raw = import.meta.env.VITE_API_URL || 'https://incentive-card-backend.vercel.app'
if (!/^https?:\/\//.test(raw)) raw = `https://${raw}`
const API_URL = raw.replace(/\/$/, '')

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
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [tierFilter, setTierFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all')
  const [programFilter, setProgramFilter] = useState<string>('all')
  const [yearLevelFilter, setYearLevelFilter] = useState<string>('all')
  const [issuedByFilter, setIssuedByFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)

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
    const response = await fetch(`${API_URL}/api/admin/students`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
      }
    })
    if (!response.ok) throw new Error('Failed to fetch students')
    const data = await response.json()
    setStudents(data)
  }

  const loadCards = async () => {
    const response = await fetch(`${API_URL}/api/admin/cards`, {
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
      const response = await fetch(`${API_URL}/api/admin/students/${studentId}`, {
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
      const response = await fetch(`${API_URL}/api/admin/cards/${cardId}`, {
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
      const response = await fetch(`${API_URL}/api/admin/packages/${packageId}`, {
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
      const response = await fetch(`${API_URL}/api/admin/students/${studentId}/status`, {
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
      const response = await fetch(`${API_URL}/api/admin/admins/${adminId}/status`, {
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
      const response = await fetch(`${API_URL}/api/admin/students/${editingStudent.id}`, {
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
      const response = await fetch(`${API_URL}/api/admin/packages/${editingPackage.id}`, {
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

  // Filter functions
  const getFilteredStudents = () => {
    return students.filter(student => {
      const matchesSearch = searchTerm === '' || 
        student.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesProgram = programFilter === 'all' || student.program === programFilter
      const matchesYear = yearLevelFilter === 'all' || student.year_level === yearLevelFilter
      
      return matchesSearch && matchesProgram && matchesYear
    })
  }

  const getFilteredCards = () => {
    return cards.filter(card => {
      const matchesSearch = searchTerm === '' || 
        card.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.package_name?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesTier = tierFilter === 'all' || card.tier === tierFilter
      const matchesStatus = statusFilter === 'all' || card.status === statusFilter
      const matchesEventType = eventTypeFilter === 'all' || card.event_type === eventTypeFilter
      const matchesIssuedBy = issuedByFilter === 'all' || card.admin_name === issuedByFilter
      
      const matchesDateFrom = !dateFrom || new Date(card.issued_date) >= new Date(dateFrom)
      const matchesDateTo = !dateTo || new Date(card.issued_date) <= new Date(dateTo)
      
      return matchesSearch && matchesTier && matchesStatus && matchesEventType && matchesIssuedBy && matchesDateFrom && matchesDateTo
    })
  }

  const getFilteredPackages = () => {
    return packages.filter(pkg => {
      const matchesSearch = searchTerm === '' || 
        pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkg.event_type.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesTier = tierFilter === 'all' || pkg.tier === tierFilter
      const matchesEventType = eventTypeFilter === 'all' || pkg.event_type === eventTypeFilter
      
      return matchesSearch && matchesTier && matchesEventType
    })
  }

  const getFilteredAdmins = () => {
    return admins.filter(admin => {
      const matchesSearch = searchTerm === '' || 
        `${admin.first_name} ${admin.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchTerm.toLowerCase())
      
      return matchesSearch
    })
  }

  // Get unique values for filters
  const uniquePrograms = Array.from(new Set(students.map(s => s.program))).sort()
  const uniqueYearLevels = Array.from(new Set(students.map(s => s.year_level))).sort()
  const uniqueEventTypes = Array.from(new Set([...cards.map(c => c.event_type), ...packages.map(p => p.event_type)])).filter(Boolean).sort()
  const uniqueIssuers = Array.from(new Set(cards.map(c => c.admin_name).filter(Boolean))).sort()

  const resetFilters = () => {
    setSearchTerm('')
    setDateFrom('')
    setDateTo('')
    setTierFilter('all')
    setStatusFilter('all')
    setEventTypeFilter('all')
    setProgramFilter('all')
    setYearLevelFilter('all')
    setIssuedByFilter('all')
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

      {/* Filters Section */}
      <div className="mb-6 bg-white rounded-xl shadow-lg overflow-hidden">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full px-6 py-4 flex items-center justify-between text-left font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-indigo-600" />
            <span>Filters</span>
            {(searchTerm || dateFrom || dateTo || tierFilter !== 'all' || statusFilter !== 'all' || eventTypeFilter !== 'all' || programFilter !== 'all' || yearLevelFilter !== 'all' || issuedByFilter !== 'all') && (
              <span className="ml-2 px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full">Active</span>
            )}
          </div>
          <span className="text-gray-400">{showFilters ? '▼' : '▶'}</span>
        </button>

        {showFilters && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Search */}
              <div className="col-span-full">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Search size={16} className="inline mr-1" />
                  Search
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, ID, email..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Date Filters (Cards only) */}
              {activeTab === 'cards' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}

              {/* Tier Filter (Cards & Packages) */}
              {(activeTab === 'cards' || activeTab === 'packages') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tier</label>
                  <select
                    value={tierFilter}
                    onChange={(e) => setTierFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="all">All Tiers</option>
                    <option value="Gold">Gold</option>
                    <option value="Silver">Silver</option>
                    <option value="Bronze">Bronze</option>
                  </select>
                </div>
              )}

              {/* Status Filter (Cards only) */}
              {activeTab === 'cards' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="Unused">Unused</option>
                    <option value="Redeemed">Redeemed</option>
                  </select>
                </div>
              )}

              {/* Event Type Filter (Cards & Packages) */}
              {(activeTab === 'cards' || activeTab === 'packages') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
                  <select
                    value={eventTypeFilter}
                    onChange={(e) => setEventTypeFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="all">All Event Types</option>
                    {uniqueEventTypes.map(et => (
                      <option key={et} value={et}>{et}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Issued By Filter (Cards only) */}
              {activeTab === 'cards' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Issued By</label>
                  <select
                    value={issuedByFilter}
                    onChange={(e) => setIssuedByFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="all">All Admins</option>
                    {uniqueIssuers.map(issuer => (
                      <option key={issuer} value={issuer}>{issuer}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Program Filter (Students only) */}
              {activeTab === 'students' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Program</label>
                  <select
                    value={programFilter}
                    onChange={(e) => setProgramFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="all">All Programs</option>
                    {uniquePrograms.map(prog => (
                      <option key={prog} value={prog}>{prog}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Year Level Filter (Students only) */}
              {activeTab === 'students' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Year Level</label>
                  <select
                    value={yearLevelFilter}
                    onChange={(e) => setYearLevelFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="all">All Year Levels</option>
                    {uniqueYearLevels.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading data...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Students Table */}
          {activeTab === 'students' && (
            <div className="overflow-auto" style={{maxHeight: '600px'}}>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Student ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Program</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Year Level</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Registered</th>
                    {isSuperAdmin && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Actions</th>}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getFilteredStudents().map((student) => (
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
              {getFilteredStudents().length === 0 && (
                <div className="text-center py-12 text-gray-500">No students match the filters</div>
              )}
            </div>
          )}

          {/* Cards Table */}
          {activeTab === 'cards' && (
            <div className="overflow-auto" style={{maxHeight: '600px'}}>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Card ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Student ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Package</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Tier</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Issued Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Issued By</th>
                    {isSuperAdmin && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Actions</th>}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getFilteredCards().map((card) => (
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
              {getFilteredCards().length === 0 && (
                <div className="text-center py-12 text-gray-500">No cards match the filters</div>
              )}
            </div>
          )}

          {/* Packages Table */}
          {activeTab === 'packages' && (
            <div className="overflow-auto" style={{maxHeight: '600px'}}>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Package ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Tier</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Event Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Level</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Benefits</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Created</th>
                    {isSuperAdmin && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Actions</th>}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getFilteredPackages().map((pkg) => (
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
              {getFilteredPackages().length === 0 && (
                <div className="text-center py-12 text-gray-500">No packages match the filters</div>
              )}
            </div>
          )}

          {/* Admins Table */}
          {activeTab === 'admins' && (
            <div className="overflow-auto" style={{maxHeight: '600px'}}>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Admin ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Created</th>
                    {isSuperAdmin && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Actions</th>}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getFilteredAdmins().map((admin) => (
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
              {getFilteredAdmins().length === 0 && (
                <div className="text-center py-12 text-gray-500">No admins match the filters</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
