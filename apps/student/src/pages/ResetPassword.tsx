import { useState, useEffect } from 'react'
import { Lock, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function ResetPassword() {
  // Build API base URL
  let raw = import.meta.env.VITE_API_URL || 'https://incentive-card-backend.vercel.app'
  if (!/^https?:\/\//.test(raw)) raw = `https://${raw}`
  const API_URL = raw.replace(/\/$/, '')
  
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token')
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Validate password length
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/api/students/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to reset password')
      }

      setSuccess(true)
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-6">
        <div className="max-w-md w-full">
          <div className="glass rounded-xl p-8 shadow-xl text-center">
            <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Invalid Reset Link</h2>
            <p className="text-gray-600 mb-6">This password reset link is invalid or has expired.</p>
            <a
              href="/login"
              className="inline-block py-3 px-6 rounded-xl font-semibold text-white"
              style={{backgroundColor: '#003f88'}}
            >
              Back to Login
            </a>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-6">
        <div className="max-w-md w-full">
          <div className="glass rounded-xl p-8 shadow-xl text-center">
            <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Password Reset Successful!</h2>
            <p className="text-gray-600 mb-6">Your password has been updated. Redirecting to login...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-6 sm:px-6">
      <div className="max-w-md w-full">
        <div className="glass rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-xl sm:shadow-2xl">
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex justify-center mb-3">
              <div className="p-2.5 sm:p-3 rounded-full" style={{backgroundColor: '#003f88'}}>
                <Lock size={32} className="text-white sm:w-10 sm:h-10" />
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Reset Password</h2>
            <p className="text-sm sm:text-base text-gray-600 mt-2">Enter your new password</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div>
              <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold mb-2 text-gray-700">
                <Lock size={14} className="sm:w-4 sm:h-4" />
                New Password
              </label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  className="w-full border-2 border-gray-200 rounded-lg sm:rounded-xl p-2.5 sm:p-3 pr-10 sm:pr-12 text-sm sm:text-base focus:ring-2 focus:border-transparent transition-all duration-200" 
                  style={{'--tw-ring-color': '#003f88'} as React.CSSProperties}
                  placeholder="••••••••" 
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={18} className="sm:w-5 sm:h-5" /> : <Eye size={18} className="sm:w-5 sm:h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold mb-2 text-gray-700">
                <Lock size={14} className="sm:w-4 sm:h-4" />
                Confirm Password
              </label>
              <div className="relative">
                <input 
                  type={showConfirmPassword ? "text" : "password"}
                  className="w-full border-2 border-gray-200 rounded-lg sm:rounded-xl p-2.5 sm:p-3 pr-10 sm:pr-12 text-sm sm:text-base focus:ring-2 focus:border-transparent transition-all duration-200" 
                  style={{'--tw-ring-color': '#003f88'} as React.CSSProperties}
                  placeholder="••••••••" 
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff size={18} className="sm:w-5 sm:h-5" /> : <Eye size={18} className="sm:w-5 sm:h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-300 text-red-800 p-3 sm:p-4 rounded-lg sm:rounded-xl flex items-start gap-2 sm:gap-3">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5 sm:w-5 sm:h-5" />
                <p className="text-xs sm:text-sm">{error}</p>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full text-white py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl font-semibold text-base sm:text-lg disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2"
              style={{backgroundColor: '#003f88'}}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#002a5c')}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#003f88')}
            >
              <Lock size={18} className="sm:w-5 sm:h-5" />
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>

          <div className="mt-4 sm:mt-6 text-center">
            <p className="text-xs sm:text-sm text-gray-600">
              Remember your password?{' '}
              <a href="/login" className="font-semibold hover:underline" style={{color: '#003f88'}}>
                Back to Login
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
