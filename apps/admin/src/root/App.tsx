import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, QrCode, CreditCard, Package, Users, LogOut, Database, Menu, X } from 'lucide-react'
import { adminStore } from '../lib/api'
import { useState, useEffect, useRef } from 'react'

export default function App(){
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const admin = adminStore.getCurrentAdmin()
  const isSuperAdmin = adminStore.isSuperAdmin()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const inactivityTimerRef = useRef<number | null>(null)
  
  const INACTIVITY_TIMEOUT = 30 * 60 * 1000 // 30 minutes in milliseconds

  const handleLogout = () => {
    adminStore.logout()
    navigate('/')
  }
  
  const resetInactivityTimer = () => {
    // Clear existing timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current)
    }
    
    // Set new timer
    inactivityTimerRef.current = window.setTimeout(() => {
      console.log('Admin inactive for 30 minutes, logging out...')
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

  const navLink = (to: string, label: string, icon: React.ReactNode, requireSuperAdmin = false) => {
    if (requireSuperAdmin && !isSuperAdmin) return null
    
    const isActive = pathname.includes(to)
    
    return (
      <Link 
        to={to}
        className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-3 ${
          isActive 
            ? 'bg-white text-indigo-700 shadow-lg' 
            : 'text-blue-100 hover:bg-white/10'
        }`}
      >
        {icon}
        <span>{label}</span>
      </Link>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 shadow-2xl flex flex-col overflow-hidden`} style={{backgroundColor: '#1f2937'}}>
        <div className="p-6 border-b" style={{borderColor: 'rgba(255,255,255,0.1)'}}>
          <h2 className="text-xl font-bold text-white tracking-wide">NAVIGATION</h2>
        </div>
        
        <nav className="space-y-2">
          {navLink('/admin/dashboard','Dashboard', <LayoutDashboard size={20} />)}
          {navLink('/admin/scan','Scan & Verify', <QrCode size={20} />)}
          {navLink('/admin/issue','Issue Card', <CreditCard size={20} />)}
          {navLink('/admin/view-data','View Data', <Database size={20} />)}
          
          {isSuperAdmin && (
            <>
              <div className="pt-6 pb-2 px-4">
                <p className="text-xs font-bold text-amber-400 uppercase tracking-widest">Super Admin</p>
              </div>
              {navLink('/admin/package','Create Package', <Package size={20} />, true)}
              {navLink('/admin/manage-admins','Manage Admins', <Users size={20} />, true)}
            </>
          )}
        </nav>

        <div className="p-4 border-t" style={{borderColor: 'rgba(255,255,255,0.1)'}}>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-3 text-red-400 hover:bg-red-900/30"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="shadow-lg border-b sticky top-0 z-40" style={{backgroundColor: '#003f88', borderColor: '#002a5c'}}>
          <div className="px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg transition-colors text-white hover:bg-white/10"
              >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}>Incentive Card System</h1>
                <p className="text-sm text-blue-200 font-medium tracking-wide">Admin Portal</p>
              </div>
            </div>
            
            {admin && (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-bold text-white tracking-wide">
                    {admin.first_name} {admin.last_name}
                  </p>
                  <p className="text-xs text-blue-200 font-medium tracking-wider">
                    {isSuperAdmin ? 'SUPER ADMINISTRATOR' : 'ADMINISTRATOR'}
                  </p>
                </div>
                <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-lg ${
                  isSuperAdmin ? 'bg-gradient-to-br from-amber-500 to-amber-600' : 'bg-gradient-to-br from-indigo-500 to-indigo-600'
                }`}>
                  {admin.first_name.charAt(0)}{admin.last_name.charAt(0)}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
        
        {/* Footer */}
        <footer className="border-t border-gray-200 py-4 px-6 text-center bg-gray-50">
          <p className="text-sm font-medium text-gray-700">College of Engineering — University of Cabuyao</p>
          <p className="text-xs text-gray-400 mt-1">Developed by Engr. Carlo</p>
        </footer>
      </div>
    </div>
  )
}
