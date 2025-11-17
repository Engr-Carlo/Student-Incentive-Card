import { useNavigate } from 'react-router-dom'
import { Shield, Users, Award, QrCode, TrendingUp, ArrowRight } from 'lucide-react'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-4">
          <img src="/images/PNC_logo.png" alt="UC Logo" className="h-16 w-auto object-contain" />
          <img src="/images/COE-logo.jpg" alt="COE Logo" className="h-16 w-16 rounded-full object-cover shadow-lg" />
        </div>
      </header>

      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 items-center">
          {/* Left Content */}
          <div className="text-center md:text-left space-y-4 animate-fadeIn">
            <div className="inline-block">
              <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold flex items-center gap-1.5 w-fit">
                <Shield size={14} />
                Admin Portal
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              <span className="text-gray-900">Incentive Card</span>
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent block mt-1">
                Management
              </span>
            </h1>
            
            <p className="text-lg text-gray-600 leading-relaxed">
              Manage student achievements, issue incentive cards, and oversee the rewards system.
            </p>

            {/* Features */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="flex items-center gap-2 text-gray-700 text-sm">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <QrCode className="text-blue-600" size={16} />
                </div>
                <span className="font-medium">Scan & Verify</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 text-sm">
                <div className="p-1.5 bg-indigo-100 rounded-lg">
                  <Award className="text-indigo-600" size={16} />
                </div>
                <span className="font-medium">Issue Cards</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 text-sm">
                <div className="p-1.5 bg-purple-100 rounded-lg">
                  <Users className="text-purple-600" size={16} />
                </div>
                <span className="font-medium">Manage Users</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 text-sm">
                <div className="p-1.5 bg-pink-100 rounded-lg">
                  <TrendingUp className="text-pink-600" size={16} />
                </div>
                <span className="font-medium">View Analytics</span>
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-4">
              <button
                onClick={() => navigate('/login')}
                className="group px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2 mx-auto md:mx-0"
              >
                Admin Login
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
              </button>
            </div>
          </div>

          {/* Right Visual */}
          <div className="hidden md:block">
            <div className="bg-white rounded-xl shadow-xl p-4 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-800">Admin Dashboard</h3>
                <Shield className="text-blue-600" size={20} />
              </div>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3">
                  <p className="text-xs text-blue-600 font-medium">Total Students</p>
                  <p className="text-xl font-bold text-blue-700 mt-0.5">1,234</p>
                </div>
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-3">
                  <p className="text-xs text-indigo-600 font-medium">Cards Issued</p>
                  <p className="text-xl font-bold text-indigo-700 mt-0.5">856</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3">
                  <p className="text-xs text-purple-600 font-medium">Active Cards</p>
                  <p className="text-xl font-bold text-purple-700 mt-0.5">623</p>
                </div>
                <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-3">
                  <p className="text-xs text-pink-600 font-medium">Redeemed</p>
                  <p className="text-xl font-bold text-pink-700 mt-0.5">233</p>
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">Recent Activity</p>
                <div className="space-y-1.5">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-700">Card issued to student</p>
                        <p className="text-xs text-gray-400">2 hours ago</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center bg-white border-t border-gray-100">
        <p className="text-sm font-medium text-gray-700">College of Engineering — University of Cabuyao</p>
        <p className="text-xs text-gray-400 mt-0.5">Developed by Engr. Carlo</p>
      </footer>
    </div>
  )
}
