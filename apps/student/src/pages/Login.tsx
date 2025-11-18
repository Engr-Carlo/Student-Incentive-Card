import { useState } from 'react'
import { LogIn, Mail, Lock, AlertCircle, Eye, EyeOff, Send } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Login(){
  // Build API base URL
  let raw = import.meta.env.VITE_API_URL || 'https://incentive-card-backend.vercel.app'
  if (!/^https?:\/\//.test(raw)) raw = `https://${raw}`
  const API_URL = raw.replace(/\/$/, '')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSuccess, setForgotSuccess] = useState('')
  const [forgotError, setForgotError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // TODO: Replace with actual API call
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      if (!response.ok) {
        throw new Error('Invalid email or password')
      }

      const data = await response.json()
      
      // Store auth token and student info
      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('student_id', data.student.student_id)
      localStorage.setItem('student_name', `${data.student.first_name} ${data.student.last_name}`)
      localStorage.setItem('student_email', data.student.email)
      
      // Redirect to dashboard
      navigate('/student/dashboard')
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email) {
      setForgotError('Please enter your email address in the login form first')
      return
    }

    setForgotError('')
    setForgotSuccess('')
    setForgotLoading(true)

    try {
      const response = await fetch(`${API_URL}/api/students/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to send password reset email')
      }

      setForgotSuccess('Password reset link has been sent to your email!')
      setTimeout(() => {
        setShowForgotModal(false)
        setForgotSuccess('')
      }, 3000)
    } catch (err: any) {
      setForgotError(err.message || 'Failed to send password reset email')
    } finally {
      setForgotLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-6 sm:px-6">
      <div className="max-w-md w-full">
        <div className="glass rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-xl sm:shadow-2xl">
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex justify-center mb-3">
              <div className="p-2.5 sm:p-3 rounded-full" style={{backgroundColor: '#003f88'}}>
                <LogIn size={32} className="text-white sm:w-10 sm:h-10" />
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Student Login</h2>
            <p className="text-sm sm:text-base text-gray-600 mt-2">Access your Incentive Card portal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div>
              <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold mb-2 text-gray-700">
                <Mail size={14} className="sm:w-4 sm:h-4" />
                Email Address
              </label>
              <input 
                type="email"
                className="w-full border-2 border-gray-200 rounded-lg sm:rounded-xl p-2.5 sm:p-3 text-sm sm:text-base focus:ring-2 focus:border-transparent transition-all duration-200" 
                style={{'--tw-ring-color': '#003f88'} as React.CSSProperties}
                placeholder="your.email@university.edu" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-700">
                  <Lock size={14} className="sm:w-4 sm:h-4" />
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs sm:text-sm font-medium hover:underline"
                  style={{color: '#003f88'}}
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  className="w-full border-2 border-gray-200 rounded-lg sm:rounded-xl p-2.5 sm:p-3 pr-10 sm:pr-12 text-sm sm:text-base focus:ring-2 focus:border-transparent transition-all duration-200" 
                  style={{'--tw-ring-color': '#003f88'} as React.CSSProperties}
                  placeholder="••••••••" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
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
              <LogIn size={18} className="sm:w-5 sm:h-5" />
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 sm:mt-6 text-center">
            <p className="text-xs sm:text-sm text-gray-600">
              Don't have an account?{' '}
              <a href="/register" className="font-semibold hover:underline" style={{color: '#003f88'}}>
                Register here
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Forgot Password?</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4">We'll send a password reset link to your registered email address.</p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-2">
                <Mail size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-900 mb-1">Email Address:</p>
                  <p className="text-sm text-blue-700 font-mono break-all">{email || 'Please enter your email in the login form'}</p>
                </div>
              </div>
            </div>

            {forgotError && (
              <div className="bg-red-50 border border-red-300 text-red-800 p-3 rounded-lg flex items-start gap-2 mb-4">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm">{forgotError}</p>
              </div>
            )}

            {forgotSuccess && (
              <div className="bg-green-50 border border-green-300 text-green-800 p-3 rounded-lg flex items-start gap-2 mb-4">
                <Send size={16} className="flex-shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm font-medium">{forgotSuccess}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false)
                  setForgotError('')
                  setForgotSuccess('')
                }}
                className="flex-1 py-2.5 sm:py-3 px-4 border-2 border-gray-300 text-gray-700 rounded-lg sm:rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={forgotLoading || !email}
                className="flex-1 py-2.5 sm:py-3 px-4 text-white rounded-lg sm:rounded-xl font-semibold disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2"
                style={{backgroundColor: '#003f88'}}
                onMouseEnter={(e) => !forgotLoading && email && (e.currentTarget.style.backgroundColor = '#002a5c')}
                onMouseLeave={(e) => !forgotLoading && email && (e.currentTarget.style.backgroundColor = '#003f88')}
              >
                <Send size={16} className="sm:w-4 sm:h-4" />
                {forgotLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
