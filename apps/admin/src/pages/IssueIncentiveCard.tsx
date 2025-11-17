import { useState, useEffect } from 'react'
import { CreditCard, QrCode, Package as PackageIcon, User, CheckCircle } from 'lucide-react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { adminStore, Package } from '../lib/api'

export default function IssueIncentiveCard(){
  const [packages, setPackages] = useState<Package[]>([])
  const [selectedPackage, setSelectedPackage] = useState<number | ''>('')
  const [scanning, setScanning] = useState(false)
  const [scannedStudentId, setScannedStudentId] = useState('')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPackages()
  }, [])

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null

    if (scanning) {
      scanner = new Html5QrcodeScanner(
        'qr-reader',
        { fps: 10, qrbox: {width: 250, height: 250} },
        false
      )

      scanner.render(onScanSuccess, onScanError)
    }

    return () => {
      if (scanner) {
        scanner.clear()
      }
    }
  }, [scanning])

  const fetchPackages = async () => {
    try {
      const data = await adminStore.getPackages()
      setPackages(data)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const onScanSuccess = (decodedText: string) => {
    setScannedStudentId(decodedText)
    setScanning(false)
  }

  const onScanError = (error: string) => {
    // Ignore scan errors
  }

  const issueCard = async () => {
    if (!selectedPackage || !scannedStudentId) {
      setError('Please select a package and scan student QR code')
      return
    }

    try {
      await adminStore.issueCard(Number(selectedPackage), scannedStudentId)
      setSuccess(true)
      setError('')
      setTimeout(() => {
        setSuccess(false)
        setScannedStudentId('')
        setSelectedPackage('')
      }, 3000)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const selectedPkg = packages.find(p => p.id === selectedPackage)

  return (
    <section className="max-w-4xl">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Issue Incentive Card</h2>
        <p className="text-gray-600">Scan student QR code to issue an incentive card</p>
      </div>

      <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200 mb-6">
        <div className="space-y-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold mb-2 text-gray-700">
              <PackageIcon size={16} />
              Select Package
            </label>
            <select 
              className="w-full border-2 border-gray-200 rounded-xl p-3 focus:ring-2 focus:border-transparent transition-all duration-200 bg-white" 
              style={{'--tw-ring-color': '#003f88'} as React.CSSProperties}
              value={selectedPackage} 
              onChange={e=>setSelectedPackage(Number(e.target.value))}
              required
            >
              <option value="">-- Select a Package --</option>
              {packages.map(pkg => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name} ({pkg.tier}) - {pkg.event_type} - {pkg.competition_level}
                </option>
              ))}
            </select>
          </div>

          {selectedPkg && (
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">Package Details:</h3>
              <p className="text-sm text-blue-800"><strong>Tier:</strong> {selectedPkg.tier}</p>
              <p className="text-sm text-blue-800"><strong>Event Type:</strong> {selectedPkg.event_type}</p>
              <p className="text-sm text-blue-800"><strong>Level:</strong> {selectedPkg.competition_level}</p>
              <p className="text-sm text-blue-800 mt-2"><strong>Benefits:</strong></p>
              <ul className="list-disc list-inside text-sm text-blue-800 ml-2">
                {selectedPkg.benefits.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <label className="flex items-center gap-2 text-sm font-semibold mb-2 text-gray-700">
              <User size={16} />
              Student QR Code
            </label>
            
            {!scanning && !scannedStudentId && (
              <button
                onClick={() => setScanning(true)}
                className="w-full py-4 px-6 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2"
                style={{backgroundColor: '#003f88'}}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#002a5c')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#003f88')}
              >
                <QrCode size={20} />
                Scan Student QR Code
              </button>
            )}

            {scanning && (
              <div className="border-2 border-gray-200 rounded-xl p-4">
                <p className="text-center text-gray-600 mb-3">Point camera at student's QR code</p>
                <div id="qr-reader"></div>
                <button
                  onClick={() => setScanning(false)}
                  className="mt-4 w-full py-2 px-4 bg-gray-200 rounded-xl hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            )}

            {scannedStudentId && (
              <div className="p-4 bg-green-50 border border-green-300 rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-semibold text-green-900">Student ID Scanned</p>
                  <p className="text-sm text-green-800">{scannedStudentId}</p>
                </div>
                <button
                  onClick={() => {
                    setScannedStudentId('')
                    setScanning(true)
                  }}
                  className="px-4 py-2 bg-white rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Scan Again
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-300 rounded-xl">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 border border-green-300 rounded-xl flex items-center gap-3">
              <CheckCircle size={24} className="text-green-600" />
              <div>
                <p className="font-semibold text-green-900">Card Issued Successfully!</p>
                <p className="text-sm text-green-800">The student will see the card in their dashboard</p>
              </div>
            </div>
          )}

          <button 
            onClick={issueCard}
            disabled={!selectedPackage || !scannedStudentId}
            className="w-full text-white py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{backgroundColor: '#003f88'}}
            onMouseEnter={(e) => !(!selectedPackage || !scannedStudentId) && (e.currentTarget.style.backgroundColor = '#002a5c')}
            onMouseLeave={(e) => !(!selectedPackage || !scannedStudentId) && (e.currentTarget.style.backgroundColor = '#003f88')}
          >
            <CreditCard size={20} />
            Issue Card to Student
          </button>
        </div>
      </div>
    </section>
  )
}
