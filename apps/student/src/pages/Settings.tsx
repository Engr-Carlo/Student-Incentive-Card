import { useState, useEffect } from 'react'
import { User, Lock, Bell, Palette, Save, QrCode } from 'lucide-react'
import { studentStore } from '../lib/api'
import QRCodeLib from 'qrcode'

interface ProfileData {
  student_id: string
  first_name: string
  last_name: string
  email: string
  program: string
  year_level: string
}

export default function Settings() {
  // Build API base URL
  let raw = import.meta.env.VITE_API_URL || 'https://incentive-card-backend.vercel.app'
  if (!/^https?:\/\//.test(raw)) raw = `https://${raw}`
  const API_URL = raw.replace(/\/$/, '')
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'preferences'>('profile')
  const [profile, setProfile] = useState<ProfileData>({
    student_id: localStorage.getItem('student_id') || '',
    first_name: '',
    last_name: '',
    email: localStorage.getItem('student_email') || '',
    program: '',
    year_level: ''
  })
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  const [preferences, setPreferences] = useState({
    email_notifications: true,
    achievement_alerts: true,
    weekly_summary: false,
    theme: 'light'
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [showQR, setShowQR] = useState(false)
  const [qrDataURL, setQrDataURL] = useState('')

  useEffect(() => {
    loadProfile()
    loadPreferences()
  }, [])

  const loadProfile = async () => {
    try {
      const response = await fetch(`${API_URL}/api/students/${localStorage.getItem('student_id')}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const loadPreferences = () => {
    const saved = localStorage.getItem('student_preferences')
    if (saved) {
      setPreferences(JSON.parse(saved))
    }
  }

  const handleUpdateProfile = async () => {
    setMessage('')
    setError('')
    
    try {
      const response = await fetch(`${API_URL}/api/students/${profile.student_id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          first_name: profile.first_name,
          last_name: profile.last_name,
          email: profile.email,
          program: profile.program,
          year_level: profile.year_level
        })
      })

      if (response.ok) {
        localStorage.setItem('student_name', `${profile.first_name} ${profile.last_name}`)
        localStorage.setItem('student_email', profile.email)
        setMessage('Profile updated successfully!')
        setTimeout(() => setMessage(''), 3000)
      } else {
        setError('Failed to update profile')
      }
    } catch (err) {
      setError('Error updating profile')
    }
  }

  const handleChangePassword = async () => {
    setMessage('')
    setError('')

    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('Passwords do not match')
      return
    }

    if (passwordData.new_password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/students/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          student_id: profile.student_id,
          current_password: passwordData.current_password,
          new_password: passwordData.new_password
        })
      })

      if (response.ok) {
        setMessage('Password changed successfully!')
        setPasswordData({ current_password: '', new_password: '', confirm_password: '' })
        setTimeout(() => setMessage(''), 3000)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to change password')
      }
    } catch (err) {
      setError('Error changing password')
    }
  }

  const handleUpdatePreferences = () => {
    localStorage.setItem('student_preferences', JSON.stringify(preferences))
    setMessage('Preferences saved successfully!')
    setTimeout(() => setMessage(''), 3000)
  }

  const generateQR = async () => {
    try {
      const qrData = await QRCodeLib.toDataURL(profile.student_id, {
        width: 300,
        margin: 2,
        color: {
          dark: '#003f88',
          light: '#FFFFFF'
        }
      })
      setQrDataURL(qrData)
      setShowQR(true)
    } catch (error) {
      console.error('Error generating QR code:', error)
    }
  }

  const downloadQR = () => {
    const link = document.createElement('a')
    link.href = qrDataURL
    link.download = `student-qr-${profile.student_id}.png`
    link.click()
  }

  const tabs = [
    { id: 'profile' as const, label: 'Profile Info', icon: <User size={16} className="sm:w-5 sm:h-5" /> },
    { id: 'password' as const, label: 'Change Password', icon: <Lock size={16} className="sm:w-5 sm:h-5" /> },
    { id: 'preferences' as const, label: 'Preferences', icon: <Bell size={16} className="sm:w-5 sm:h-5" /> }
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 px-4 sm:px-0">
      <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg sm:shadow-xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">Settings</h1>
        <p className="text-sm sm:text-base text-gray-600">Manage your account settings and preferences</p>
      </div>

      {/* Tabs */}
      <div className="glass rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl overflow-hidden">
        <div className="border-b border-gray-200 bg-white/50">
          <div className="flex flex-col sm:flex-row">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-4 py-3 sm:px-6 sm:py-4 font-semibold transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base ${
                  activeTab === tab.id
                    ? 'border-l-4 sm:border-l-0 sm:border-b-2 border-indigo-600 text-indigo-600 bg-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/30'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {/* Messages */}
          {message && (
            <div className="mb-4 sm:mb-6 bg-green-50 border border-green-200 text-green-700 px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg text-sm sm:text-base">
              {message}
            </div>
          )}
          {error && (
            <div className="mb-4 sm:mb-6 bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg text-sm sm:text-base">
              {error}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800">Personal Information</h2>
                <button
                  onClick={generateQR}
                  className="w-full sm:w-auto px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-white font-medium transition-all hover:shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base"
                  style={{backgroundColor: '#003f88'}}
                >
                  <QrCode size={16} className="sm:w-[18px] sm:h-[18px]" />
                  Show QR Code
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">First Name</label>
                  <input
                    type="text"
                    value={profile.first_name}
                    onChange={(e) => setProfile({...profile, first_name: e.target.value})}
                    className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Last Name</label>
                  <input
                    type="text"
                    value={profile.last_name}
                    onChange={(e) => setProfile({...profile, last_name: e.target.value})}
                    className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Student ID</label>
                  <input
                    type="text"
                    value={profile.student_id}
                    disabled
                    className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({...profile, email: e.target.value})}
                    className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Program</label>
                  <input
                    type="text"
                    value={profile.program}
                    onChange={(e) => setProfile({...profile, program: e.target.value})}
                    className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors text-sm sm:text-base"
                    placeholder="e.g., BS Computer Engineering"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Year Level</label>
                  <select
                    value={profile.year_level}
                    onChange={(e) => setProfile({...profile, year_level: e.target.value})}
                    className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors text-sm sm:text-base"
                  >
                    <option value="">Select Year Level</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="5th Year">5th Year</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleUpdateProfile}
                className="w-full py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg text-white font-semibold transition-all hover:shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base"
                style={{backgroundColor: '#003f88'}}
              >
                <Save size={18} className="sm:w-5 sm:h-5" />
                Save Changes
              </button>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6">Change Password</h2>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Current Password</label>
                <input
                  type="password"
                  value={passwordData.current_password}
                  onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})}
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">New Password</label>
                <input
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors text-sm sm:text-base"
                  placeholder="At least 6 characters"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors text-sm sm:text-base"
                />
              </div>

              <button
                onClick={handleChangePassword}
                className="w-full py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg text-white font-semibold transition-all hover:shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base"
                style={{backgroundColor: '#003f88'}}
              >
                <Lock size={18} className="sm:w-5 sm:h-5" />
                Change Password
              </button>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6">Notification Preferences</h2>

              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between p-3 sm:p-4 glass rounded-lg border border-white/20 sm:border-2">
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="font-semibold text-gray-800 text-sm sm:text-base">Email Notifications</p>
                    <p className="text-xs sm:text-sm text-gray-600">Receive email updates about your cards</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={preferences.email_notifications}
                      onChange={(e) => setPreferences({...preferences, email_notifications: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 sm:p-4 glass rounded-lg border border-white/20 sm:border-2">
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="font-semibold text-gray-800 text-sm sm:text-base">Achievement Alerts</p>
                    <p className="text-xs sm:text-sm text-gray-600">Get notified when you receive new cards</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={preferences.achievement_alerts}
                      onChange={(e) => setPreferences({...preferences, achievement_alerts: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 sm:p-4 glass rounded-lg border border-white/20 sm:border-2">
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="font-semibold text-gray-800 text-sm sm:text-base">Weekly Summary</p>
                    <p className="text-xs sm:text-sm text-gray-600">Receive weekly activity summaries</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.weekly_summary}
                      onChange={(e) => setPreferences({...preferences, weekly_summary: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>

              <button
                onClick={handleUpdatePreferences}
                className="w-full py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg text-white font-semibold transition-all hover:shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base"
                style={{backgroundColor: '#003f88'}}
              >
                <Save size={18} className="sm:w-5 sm:h-5" />
                Save Preferences
              </button>
            </div>
          )}
        </div>
      </div>

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowQR(false)}>
          <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4 text-center">Your Student QR Code</h3>
            <p className="text-xs sm:text-sm text-gray-600 text-center mb-4 sm:mb-6">Show this QR code to admin to receive incentive cards</p>
            
            <div className="bg-gray-50 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 flex justify-center">
              <img src={qrDataURL} alt="Student QR Code" className="w-full max-w-[250px] sm:max-w-[300px]" />
            </div>

            <div className="text-center mb-4 sm:mb-6">
              <p className="text-base sm:text-lg font-bold text-gray-800">{profile.first_name} {profile.last_name}</p>
              <p className="text-xs sm:text-sm text-gray-600">Student ID: {profile.student_id}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={downloadQR}
                className="flex-1 py-2.5 sm:py-3 px-4 rounded-xl font-semibold text-white transition-all text-sm sm:text-base"
                style={{backgroundColor: '#003f88'}}
              >
                Download QR
              </button>
              <button
                onClick={() => setShowQR(false)}
                className="flex-1 py-2.5 sm:py-3 px-4 bg-gray-200 rounded-xl font-semibold text-gray-800 hover:bg-gray-300 transition-all text-sm sm:text-base"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
