import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, Mail, Lock, User, IdCard, BookOpen, CheckCircle, Send, Shield } from 'lucide-react'

export default function Register(){
  // Build API base URL
  let raw = import.meta.env.VITE_API_URL || 'https://incentive-card-backend.vercel.app'
  if (!/^https?:\/\//.test(raw)) raw = `https://${raw}`
  const API_URL = raw.replace(/\/$/, '')
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    studentId: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    program: '',
    yearLevel: ''
  })
  const [verificationCode, setVerificationCode] = useState('')
  const [emailVerified, setEmailVerified] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [sendingCode, setSendingCode] = useState(false)
  const [verifyingCode, setVerifyingCode] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    // Reset verification if email changes
    if (e.target.name === 'email') {
      setEmailVerified(false)
      setCodeSent(false)
      setVerificationCode('')
    }
  }

  const sendVerificationCode = async () => {
    if (!formData.email) {
      setError('Please enter your email address')
      return
    }

    setSendingCode(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/api/auth/send-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to send verification code')
      }

      setCodeSent(true)
      setError('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSendingCode(false)
    }
  }

  const verifyCode = async () => {
    if (!verificationCode) {
      setError('Please enter the verification code')
      return
    }

    setVerifyingCode(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/api/auth/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: formData.email,
          code: verificationCode 
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Invalid verification code')
      }

      setEmailVerified(true)
      setError('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setVerifyingCode(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Check email verification
    if (!emailVerified) {
      setError('Please verify your email address first')
      return
    }

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: formData.studentId,
          email: formData.email,
          password: formData.password,
          first_name: formData.firstName,
          last_name: formData.lastName,
          program: formData.program,
          year_level: formData.yearLevel
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Registration failed')
      }

      setSuccess(true)
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <section className="max-w-4xl mx-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-xl sm:shadow-2xl">
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-3">
            <div className="p-2.5 sm:p-3 rounded-full" style={{backgroundColor: '#003f88'}}>
              <UserPlus size={32} className="text-white sm:w-10 sm:h-10" />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Create Student Account</h2>
          <p className="text-sm sm:text-base text-gray-600 mt-2">Register to access your Incentive Card portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold mb-2 text-gray-700">
                <IdCard size={14} className="sm:w-4 sm:h-4" />
                Student ID
              </label>
              <input 
                name="studentId"
                className="w-full border-2 border-gray-200 rounded-lg sm:rounded-xl p-2.5 sm:p-3 text-sm sm:text-base focus:ring-2 focus:border-transparent transition-all duration-200" 
                style={{'--tw-ring-color': '#003f88'} as React.CSSProperties}
                placeholder="e.g., 2021-12345" 
                value={formData.studentId}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold mb-2 text-gray-700">
                <Mail size={14} className="sm:w-4 sm:h-4" />
                Email Address
              </label>
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input 
                    type="email"
                    name="email"
                    className="flex-1 border-2 border-gray-200 rounded-lg sm:rounded-xl p-2.5 sm:p-3 text-sm sm:text-base focus:ring-2 focus:border-transparent transition-all duration-200" 
                    style={{'--tw-ring-color': '#003f88'} as React.CSSProperties}
                    placeholder="your.email@university.edu" 
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={emailVerified}
                  />
                  {!emailVerified && (
                    <button
                      type="button"
                      onClick={sendVerificationCode}
                      disabled={sendingCode || !formData.email}
                      className="w-full sm:w-auto px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-blue-600 text-white rounded-lg sm:rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      {sendingCode ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          {codeSent ? 'Resend' : 'Verify'}
                        </>
                      )}
                    </button>
                  )}
                  {emailVerified && (
                    <div className="w-full sm:w-auto px-4 py-2.5 sm:py-3 bg-green-100 text-green-800 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base flex items-center justify-center gap-2">
                      <CheckCircle size={14} className="sm:w-4 sm:h-4" />
                      Verified
                    </div>
                  )}
                </div>
                
                {codeSent && !emailVerified && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg sm:rounded-xl p-3 sm:p-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <Shield size={14} className="text-blue-600 mt-0.5 sm:w-4 sm:h-4 flex-shrink-0" />
                      <p className="text-xs sm:text-sm text-blue-800">
                        We sent a 6-digit code to <strong>{formData.email}</strong>. Please check your inbox.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        placeholder="Enter 6-digit code"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="flex-1 border-2 border-blue-200 rounded-lg p-2 sm:p-2.5 text-center text-base sm:text-lg font-mono tracking-wider focus:ring-2 focus:border-transparent"
                        style={{'--tw-ring-color': '#003f88'} as React.CSSProperties}
                        maxLength={6}
                      />
                      <button
                        type="button"
                        onClick={verifyCode}
                        disabled={verifyingCode || verificationCode.length !== 6}
                        className="w-full sm:w-auto px-4 py-2 sm:py-2.5 text-sm sm:text-base bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        {verifyingCode ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        ) : (
                          'Verify Code'
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold mb-2 text-gray-700">
                <User size={14} className="sm:w-4 sm:h-4" />
                First Name
              </label>
              <input 
                name="firstName"
                className="w-full border-2 border-gray-200 rounded-lg sm:rounded-xl p-2.5 sm:p-3 text-sm sm:text-base focus:ring-2 focus:border-transparent transition-all duration-200" 
                style={{'--tw-ring-color': '#003f88'} as React.CSSProperties}
                placeholder="Juan" 
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold mb-2 text-gray-700">
                <User size={14} className="sm:w-4 sm:h-4" />
                Last Name
              </label>
              <input 
                name="lastName"
                className="w-full border-2 border-gray-200 rounded-lg sm:rounded-xl p-2.5 sm:p-3 text-sm sm:text-base focus:ring-2 focus:border-transparent transition-all duration-200" 
                style={{'--tw-ring-color': '#003f88'} as React.CSSProperties}
                placeholder="Dela Cruz" 
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold mb-2 text-gray-700">
                <BookOpen size={14} className="sm:w-4 sm:h-4" />
                Program/Course
              </label>
              <select 
                name="program"
                className="w-full border-2 border-gray-200 rounded-lg sm:rounded-xl p-2.5 sm:p-3 text-sm sm:text-base focus:ring-2 focus:border-transparent transition-all duration-200 bg-white" 
                style={{'--tw-ring-color': '#003f88'} as React.CSSProperties}
                value={formData.program}
                onChange={handleChange}
                required
              >
                <option value="">-- Select Program --</option>
                <option value="BS Computer Engineering">BS Computer Engineering</option>
                <option value="BS Electronics Engineering">BS Electronics Engineering</option>
                <option value="BS Industrial Engineering">BS Industrial Engineering</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold mb-2 text-gray-700">
                <BookOpen size={14} className="sm:w-4 sm:h-4" />
                Year Level
              </label>
              <select 
                name="yearLevel"
                className="w-full border-2 border-gray-200 rounded-lg sm:rounded-xl p-2.5 sm:p-3 text-sm sm:text-base focus:ring-2 focus:border-transparent transition-all duration-200 bg-white" 
                style={{'--tw-ring-color': '#003f88'} as React.CSSProperties}
                value={formData.yearLevel}
                onChange={handleChange}
                required
              >
                <option value="">-- Select Year --</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="5th Year">5th Year</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold mb-2 text-gray-700">
                <Lock size={14} className="sm:w-4 sm:h-4" />
                Password
              </label>
              <input 
                type="password"
                name="password"
                className="w-full border-2 border-gray-200 rounded-lg sm:rounded-xl p-2.5 sm:p-3 text-sm sm:text-base focus:ring-2 focus:border-transparent transition-all duration-200" 
                style={{'--tw-ring-color': '#003f88'} as React.CSSProperties}
                placeholder="••••••••" 
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold mb-2 text-gray-700">
                <Lock size={14} className="sm:w-4 sm:h-4" />
                Confirm Password
              </label>
              <input 
                type="password"
                name="confirmPassword"
                className="w-full border-2 border-gray-200 rounded-lg sm:rounded-xl p-2.5 sm:p-3 text-sm sm:text-base focus:ring-2 focus:border-transparent transition-all duration-200" 
                style={{'--tw-ring-color': '#003f88'} as React.CSSProperties}
                placeholder="••••••••" 
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength={6}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-300 text-red-800 p-4 rounded-xl">
              <p className="font-semibold">{error}</p>
            </div>
          )}

          <button 
            type="submit"
            className="w-full text-white py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl font-semibold text-base sm:text-lg transition-all duration-200 flex items-center justify-center gap-2"
            style={{backgroundColor: '#003f88'}}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#002a5c')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#003f88')}
          >
            <UserPlus size={18} className="sm:w-5 sm:h-5" />
            Create Account
          </button>

          {success && (
            <div className="bg-green-50 border border-green-300 text-green-800 p-3 sm:p-4 rounded-lg sm:rounded-xl">
              <div className="flex items-center gap-3">
                <CheckCircle size={24} className="text-green-600" />
                <div>
                  <p className="font-semibold">Account created successfully!</p>
                  <p className="text-sm">Redirecting to login page...</p>
                </div>
              </div>
            </div>
          )}
        </form>

        <div className="mt-4 sm:mt-6 text-center">
          <p className="text-xs sm:text-sm text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="font-semibold" style={{color: '#003f88'}}>
              Sign in here
            </a>
          </p>
        </div>
      </div>
    </section>
  )
}
