import { useState } from 'react'
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Login(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // TODO: Replace with actual API call
      const response = await fetch('http://localhost:3001/api/auth/login', {
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="glass rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-3">
              <div className="p-3 rounded-full" style={{backgroundColor: '#003f88'}}>
                <LogIn size={40} className="text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-800">Student Login</h2>
            <p className="text-gray-600 mt-2">Access your Incentive Card portal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold mb-2 text-gray-700">
                <Mail size={16} />
                Email Address
              </label>
              <input 
                type="email"
                className="w-full border-2 border-gray-200 rounded-xl p-3 focus:ring-2 focus:border-transparent transition-all duration-200" 
                style={{'--tw-ring-color': '#003f88'} as React.CSSProperties}
                placeholder="your.email@university.edu" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold mb-2 text-gray-700">
                <Lock size={16} />
                Password
              </label>
              <input 
                type="password"
                className="w-full border-2 border-gray-200 rounded-xl p-3 focus:ring-2 focus:border-transparent transition-all duration-200" 
                style={{'--tw-ring-color': '#003f88'} as React.CSSProperties}
                placeholder="••••••••" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-300 text-red-800 p-4 rounded-xl flex items-start gap-3">
                <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full text-white py-4 px-6 rounded-xl font-semibold text-lg disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2"
              style={{backgroundColor: '#003f88'}}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#002a5c')}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#003f88')}
            >
              <LogIn size={20} />
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <a href="/register" className="font-semibold hover:underline" style={{color: '#003f88'}}>
                Register here
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
