import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, CreditCard, User, Settings, LogOut } from 'lucide-react'
import { useEffect, useRef } from 'react'

function Logo() {
  return (
    <svg className="w-10 h-10" viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1e40af" />
        </linearGradient>
      </defs>
      <rect x="10" y="20" width="80" height="50" rx="8" fill="url(#cardGrad)" />
      <rect x="10" y="20" width="80" height="50" rx="8" fill="none" stroke="white" strokeWidth="2" />
      <circle cx="50" cy="45" r="12" fill="white" opacity="0.3" />
      <path d="M 30 35 L 38 43 L 52 29" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <rect x="58" y="38" width="15" height="3" rx="1.5" fill="white" opacity="0.8" />
      <rect x="58" y="44" width="20" height="3" rx="1.5" fill="white" opacity="0.6" />
    </svg>
  )
}

export default function App() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const studentName = localStorage.getItem('student_name') || 'Student'
  const inactivityTimerRef = useRef<number | null>(null)
  
  const INACTIVITY_TIMEOUT = 30 * 60 * 1000 // 30 minutes in milliseconds
  
  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('student_id')
    localStorage.removeItem('student_name')
    localStorage.removeItem('student_email')
    navigate('/login')
  }
  
  const resetInactivityTimer = () => {
    // Clear existing timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current)
    }
    
    // Set new timer
    inactivityTimerRef.current = window.setTimeout(() => {
      console.log('User inactive for 30 minutes, logging out...')
      handleLogout()
    }, INACTIVITY_TIMEOUT)
  }
  
  useEffect(() => {
    // Events that indicate user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    // Reset timer on any user activity
    events.forEach(event => {
      document.addEventListener(event, resetInactivityTimer)
    })
    
    // Initialize the timer
    resetInactivityTimer()
    
    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetInactivityTimer)
      })
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
      }
    }
  }, [])
  
  const link = (to: string, label: string, icon: React.ReactNode) => (
    <Link 
      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
        pathname.includes(to) 
          ? 'text-white shadow-lg' 
          : 'text-blue-100'
      }`}
      style={pathname.includes(to) ? {backgroundColor: '#002a5c'} : undefined}
      onMouseEnter={(e) => !pathname.includes(to) && (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')}
      onMouseLeave={(e) => !pathname.includes(to) && (e.currentTarget.style.backgroundColor = 'transparent')} 
      to={to}
    >
      <span>{icon}</span>
      <span className="hidden md:inline">{label}</span>
    </Link>
  )
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 overflow-x-hidden">
      <header className="shadow-lg sticky top-0 z-50 w-full" style={{backgroundColor: '#003f88'}}>
        <div className="max-w-7xl mx-auto px-4 py-4 w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo />
              <div>
                <h1 className="text-2xl font-bold text-white">Incentive Card</h1>
                <p className="text-xs text-blue-100">Welcome, {studentName}</p>
              </div>
            </div>
            <nav className="flex gap-2 items-center">
              {link('/student/dashboard','Dashboard',<LayoutDashboard size={18} />)}
              {link('/student/my-cards','My Cards',<CreditCard size={18} />)}
              {link('/student/profile','Profile',<User size={18} />)}
              {link('/student/settings','Settings',<Settings size={18} />)}
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 text-blue-100 hover:bg-white/10"
              >
                <LogOut size={18} />
                <span className="hidden md:inline">Logout</span>
              </button>
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <Outlet />
      </main>
      <footer className="glass mt-auto border-t border-white/20 w-full">
        <div className="max-w-7xl mx-auto px-4 py-5 text-center bg-white w-full">
          <p className="text-gray-700 font-medium">College of Engineering — University of Cabuyao</p>
          <p className="text-xs text-gray-400 mt-1">Developed by Engr. Carlo</p>
        </div>
      </footer>
    </div>
  )
}
