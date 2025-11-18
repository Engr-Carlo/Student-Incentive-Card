import { useState, useEffect, useRef } from 'react'
import { User, Info, BarChart3, FileText, CreditCard, CheckCircle, Upload, QrCode } from 'lucide-react'
import { studentStore } from '../lib/api'
import QRCodeLib from 'qrcode'

export default function Profile(){
  const [stats, setStats] = useState({ total: 0, unused: 0, redeemed: 0, pending: 0 })
  const [history, setHistory] = useState<any[]>([])
  const [showQR, setShowQR] = useState(false)
  const [qrDataURL, setQrDataURL] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const profile = {
    name: localStorage.getItem('student_name') || 'Student',
    studentId: localStorage.getItem('student_id') || '',
    email: localStorage.getItem('student_email') || '',
    program: 'BS Computer Engineering',
    yearLevel: '3rd Year'
  }

  useEffect(() => {
    studentStore.getStats().then(setStats)
    studentStore.getActivityHistory().then(setHistory)
  }, [])

  const generateQR = async () => {
    try {
      const qrData = await QRCodeLib.toDataURL(profile.studentId, {
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
    link.download = `student-qr-${profile.studentId}.png`
    link.click()
  }
  return (
    <section className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg sm:shadow-2xl">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="p-1.5 sm:p-2 rounded-full" style={{backgroundColor: '#003f88'}}>
            <User size={24} className="text-white sm:w-8 sm:h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">My Profile</h2>
        </div>
        
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          <div className="glass rounded-lg sm:rounded-xl p-4 sm:p-6 border border-white/20 sm:border-2">
            <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4 flex items-center gap-2">
              <Info size={16} className="sm:w-5 sm:h-5" />
              <span>Personal Information</span>
            </h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="pb-2 sm:pb-3 border-b border-gray-200">
                <label className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide">Name</label>
                <p className="font-semibold text-base sm:text-lg">{profile.name}</p>
              </div>
              <div className="pb-2 sm:pb-3 border-b border-gray-200">
                <label className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide">Student ID</label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                  <p className="font-semibold text-sm sm:text-base">{profile.studentId}</p>
                  <button
                    onClick={generateQR}
                    className="w-full sm:w-auto px-3 py-1.5 sm:py-1 rounded-lg text-white text-xs sm:text-sm font-medium transition-all hover:shadow-lg flex items-center justify-center gap-1"
                    style={{backgroundColor: '#003f88'}}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#002a5c')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#003f88')}
                  >
                    <QrCode size={14} className="sm:w-4 sm:h-4" />
                    Generate QR
                  </button>
                </div>
              </div>
              <div className="pb-2 sm:pb-3 border-b border-gray-200">
                <label className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide">Email</label>
                <p className="font-semibold text-sm sm:text-base text-blue-600 break-all">{profile.email}</p>
              </div>
              <div className="pb-2 sm:pb-3 border-b border-gray-200">
                <label className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide">Program</label>
                <p className="font-semibold text-sm sm:text-base">{profile.program}</p>
              </div>
              <div>
                <label className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide">Year Level</label>
                <p className="font-semibold text-sm sm:text-base">{profile.yearLevel}</p>
              </div>
            </div>
          </div>

          <div className="glass rounded-lg sm:rounded-xl p-4 sm:p-6 border border-white/20 sm:border-2">
            <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4 flex items-center gap-2">
              <BarChart3 size={16} className="sm:w-5 sm:h-5" />
              <span>Statistics</span>
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 lg:p-5 rounded-lg sm:rounded-xl text-white shadow-lg text-center transform transition-transform active:scale-95 sm:hover:scale-105" style={{backgroundColor: '#003f88'}}>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold">{stats.total}</p>
                <p className="text-[10px] sm:text-xs lg:text-sm mt-1 opacity-90">Total Cards</p>
              </div>
              <div className="p-3 sm:p-4 lg:p-5 bg-green-600 rounded-lg sm:rounded-xl text-white shadow-lg text-center transform transition-transform active:scale-95 sm:hover:scale-105">
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold">{stats.unused}</p>
                <p className="text-[10px] sm:text-xs lg:text-sm mt-1 opacity-90">Unused</p>
              </div>
              <div className="p-3 sm:p-4 lg:p-5 bg-gray-600 rounded-lg sm:rounded-xl text-white shadow-lg text-center transform transition-transform active:scale-95 sm:hover:scale-105">
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold">{stats.redeemed}</p>
                <p className="text-[10px] sm:text-xs lg:text-sm mt-1 opacity-90">Redeemed</p>
              </div>
              <div className="p-3 sm:p-4 lg:p-5 bg-yellow-600 rounded-lg sm:rounded-xl text-white shadow-lg text-center transform transition-transform active:scale-95 sm:hover:scale-105">
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold">{stats.pending}</p>
                <p className="text-[10px] sm:text-xs lg:text-sm mt-1 opacity-90">Pending</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg sm:shadow-2xl">
        <h3 className="font-bold text-lg sm:text-xl mb-3 sm:mb-4 flex items-center gap-2">
          <FileText size={18} className="sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
          <span>Activity History</span>
        </h3>
        <div className="space-y-2 sm:space-y-3">
          {history.map(h => {
            const IconComponent = h.type === 'issued' ? CreditCard : h.type === 'redeemed' ? CheckCircle : Upload
            return (
              <div key={h.id} className="glass rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/20 sm:border-2 transition-all duration-200 active:scale-[0.98] sm:hover:scale-102">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className="p-1.5 sm:p-2 rounded-lg flex-shrink-0" style={{backgroundColor: '#003f88'}}>
                      <IconComponent size={16} className="text-white sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm sm:text-base text-gray-800 truncate">{h.action}</p>
                      <p className="text-xs sm:text-sm text-gray-600">{h.event}</p>
                      {h.course && (
                        <p className="text-[10px] sm:text-xs text-blue-600 mt-1 flex items-center gap-1">
                          <span>Course: {h.course}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 bg-white/50 px-3 py-1 rounded-full">
                    {h.date}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowQR(false)}>
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">Your Student QR Code</h3>
            <p className="text-sm text-gray-600 text-center mb-6">Show this QR code to admin to receive incentive cards</p>
            
            <div className="bg-gray-50 rounded-xl p-6 mb-6 flex justify-center">
              <img src={qrDataURL} alt="Student QR Code" className="w-full max-w-[300px]" />
            </div>

            <div className="text-center mb-6">
              <p className="text-lg font-bold text-gray-800">{profile.name}</p>
              <p className="text-sm text-gray-600">Student ID: {profile.studentId}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={downloadQR}
                className="flex-1 py-3 px-4 rounded-xl font-semibold text-white transition-all"
                style={{backgroundColor: '#003f88'}}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#002a5c')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#003f88')}
              >
                Download QR
              </button>
              <button
                onClick={() => setShowQR(false)}
                className="flex-1 py-3 px-4 bg-gray-200 rounded-xl font-semibold text-gray-800 hover:bg-gray-300 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
