import { useState, useEffect } from 'react'
import { adminStore, Admin, Package } from '../lib/api'

export function ManageAdmins() {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [packages, setPackages] = useState<Package[]>([])
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null)
  const [adminPackages, setAdminPackages] = useState<Package[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [role, setRole] = useState<'admin' | 'super_admin'>('admin')

  useEffect(() => {
    loadAdmins()
    loadPackages()
  }, [])

  const loadAdmins = async () => {
    try {
      const data = await adminStore.getAllAdmins()
      setAdmins(data)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const loadPackages = async () => {
    try {
      const data = await adminStore.getPackages()
      setPackages(data)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const loadAdminPackages = async (admin: Admin) => {
    if (admin.role === 'super_admin') {
      setAdminPackages(packages)
      return
    }

    try {
      const data = await adminStore.getAdminPackageAccess(admin.id)
      setAdminPackages(data)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await adminStore.createAdmin(email, password, firstName, lastName, role)
      setSuccess('Admin created successfully!')
      setShowCreateForm(false)
      setEmail('')
      setPassword('')
      setFirstName('')
      setLastName('')
      setRole('admin')
      loadAdmins()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGrantAccess = async (packageId: number) => {
    if (!selectedAdmin) return

    try {
      await adminStore.grantPackageAccess(selectedAdmin.id, packageId)
      setSuccess('Package access granted!')
      loadAdminPackages(selectedAdmin)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleRevokeAccess = async (packageId: number) => {
    if (!selectedAdmin) return

    try {
      await adminStore.revokePackageAccess(selectedAdmin.id, packageId)
      setSuccess('Package access revoked!')
      loadAdminPackages(selectedAdmin)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleSelectAdmin = (admin: Admin) => {
    setSelectedAdmin(admin)
    loadAdminPackages(admin)
  }

  const handleDeleteAdmin = async (adminId: number, adminName: string) => {
    if (!confirm(`Are you sure you want to delete ${adminName}? This action cannot be undone.`)) {
      return
    }

    try {
      await adminStore.deleteAdmin(adminId)
      setSuccess('Admin deleted successfully!')
      if (selectedAdmin?.id === adminId) {
        setSelectedAdmin(null)
      }
      loadAdmins()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const hasPackageAccess = (packageId: number) => {
    return adminPackages.some(p => p.id === packageId)
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Admins</h1>
        <p className="text-gray-600">Create admin accounts and manage package access</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Admins List */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Admin Accounts</h2>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {showCreateForm ? 'Cancel' : '+ New Admin'}
            </button>
          </div>

          {showCreateForm && (
            <form onSubmit={handleCreateAdmin} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'admin' | 'super_admin')}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="admin">Regular Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Admin'}
              </button>
            </form>
          )}

          <div className="space-y-3">
            {admins.map((admin) => (
              <div
                key={admin.id}
                className={`p-4 border-2 rounded-lg transition-colors ${
                  selectedAdmin?.id === admin.id
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div
                    onClick={() => handleSelectAdmin(admin)}
                    className="flex-1 cursor-pointer"
                  >
                    <h3 className="font-semibold text-gray-900">
                      {admin.first_name} {admin.last_name}
                    </h3>
                    <p className="text-sm text-gray-600">{admin.email}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      admin.role === 'super_admin'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                  </span>
                </div>
                {admin.role !== 'super_admin' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteAdmin(admin.id, `${admin.first_name} ${admin.last_name}`)
                    }}
                    className="w-full mt-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                  >
                    Delete Admin
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Package Access Management */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Package Access</h2>

          {selectedAdmin ? (
            <>
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900">
                  {selectedAdmin.first_name} {selectedAdmin.last_name}
                </h3>
                <p className="text-sm text-gray-600">{selectedAdmin.email}</p>
                {selectedAdmin.role === 'super_admin' && (
                  <p className="text-sm text-purple-600 mt-2">
                    ✓ Super admin has access to all packages
                  </p>
                )}
              </div>

              {selectedAdmin.role !== 'super_admin' && (
                <div className="space-y-3">
                  {packages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="p-4 border rounded-lg flex justify-between items-center"
                    >
                      <div>
                        <h4 className="font-semibold text-gray-900">{pkg.name}</h4>
                        <p className="text-sm text-gray-600">
                          {pkg.tier} • {pkg.event_type}
                        </p>
                      </div>
                      {hasPackageAccess(pkg.id) ? (
                        <button
                          onClick={() => handleRevokeAccess(pkg.id)}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          Revoke
                        </button>
                      ) : (
                        <button
                          onClick={() => handleGrantAccess(pkg.id)}
                          className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                        >
                          Grant
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {selectedAdmin.role === 'super_admin' && (
                <div className="space-y-3">
                  {packages.map((pkg) => (
                    <div key={pkg.id} className="p-4 border rounded-lg bg-purple-50">
                      <h4 className="font-semibold text-gray-900">{pkg.name}</h4>
                      <p className="text-sm text-gray-600">
                        {pkg.tier} • {pkg.event_type}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>Select an admin to manage package access</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
