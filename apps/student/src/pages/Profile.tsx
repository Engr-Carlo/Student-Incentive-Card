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
    <section className="space-y-6">
      <div className="glass rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-full" style={{backgroundColor: '#003f88'}}>
            <User size={32} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800">My Profile</h2>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div className="glass rounded-xl p-6 border-2 border-white/20">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Info size={20} />
              <span>Personal Information</span>
            </h3>
            <div className="space-y-4">
              <div className="pb-3 border-b border-gray-200">
                <label className="text-xs text-gray-500 uppercase tracking-wide">Name</label>
                <p className="font-semibold text-lg">{profile.name}</p>
              </div>
              <div className="pb-3 border-b border-gray-200">
                <label className="text-xs text-gray-500 uppercase tracking-wide">Student ID</label>
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{profile.studentId}</p>
                  <button
                    onClick={generateQR}
                    className="px-3 py-1 rounded-lg text-white text-sm font-medium transition-all hover:shadow-lg flex items-center gap-1"
                    style={{backgroundColor: '#003f88'}}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#002a5c')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#003f88')}
                  >
                    <QrCode size={16} />
                    Generate QR
                  </button>
                </div>
              </div>
              <div className="pb-3 border-b border-gray-200">
                <label className="text-xs text-gray-500 uppercase tracking-wide">Email</label>
                <p className="font-semibold text-blue-600">{profile.email}</p>
              </div>
              <div className="pb-3 border-b border-gray-200">
                <label className="text-xs text-gray-500 uppercase tracking-wide">Program</label>
                <p className="font-semibold">{profile.program}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">Year Level</label>
                <p className="font-semibold">{profile.yearLevel}</p>
              </div>
            </div>
          </div>

          <div className="glass rounded-xl p-6 border-2 border-white/20">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <BarChart3 size={20} />
              <span>Statistics</span>
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 rounded-xl text-white shadow-lg text-center transform transition-transform hover:scale-105" style={{backgroundColor: '#003f88'}}>
                <p className="text-4xl font-bold">{stats.total}</p>
                <p className="text-sm mt-1 opacity-90">Total Cards</p>
              </div>
              <div className="p-5 bg-green-600 rounded-xl text-white shadow-lg text-center transform transition-transform hover:scale-105">
                <p className="text-4xl font-bold">{stats.unused}</p>
                <p className="text-sm mt-1 opacity-90">Unused</p>
              </div>
              <div className="p-5 bg-gray-600 rounded-xl text-white shadow-lg text-center transform transition-transform hover:scale-105">
                <p className="text-4xl font-bold">{stats.redeemed}</p>
                <p className="text-sm mt-1 opacity-90">Redeemed</p>
              </div>
              <div className="p-5 bg-yellow-600 rounded-xl text-white shadow-lg text-center transform transition-transform hover:scale-105">
                <p className="text-4xl font-bold">{stats.pending}</p>
                <p className="text-sm mt-1 opacity-90">Pending</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 shadow-2xl">
        <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
          <FileText size={22} />
          <span>Activity History</span>
        </h3>
        <div className="space-y-3">
          {history.map(h => {
            const IconComponent = h.type === 'issued' ? CreditCard : h.type === 'redeemed' ? CheckCircle : Upload
            return (
              <div key={h.id} className="glass rounded-xl p-4 border-2 border-white/20 hover:shadow-lg transition-all duration-200 hover:scale-102">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg" style={{backgroundColor: '#003f88'}}>
                      <IconComponent size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{h.action}</p>
                      <p className="text-sm text-gray-600">{h.event}</p>
                      {h.course && (
                        <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
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
