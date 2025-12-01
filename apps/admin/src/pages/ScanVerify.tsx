/// <reference types="vite/client" />
import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { QrCode, CheckCircle, XCircle, Camera, Award, Calendar, Gift } from 'lucide-react'

// Build API base URL
let raw = import.meta.env.VITE_API_URL || 'https://incentive-card-backend.vercel.app'
if (!/^https?:\/\//.test(raw)) raw = `https://${raw}`
const API_URL = raw.replace(/\/$/, '')

export default function ScanVerify(){
  const videoRef = useRef<HTMLVideoElement|null>(null)
  const [result, setResult] = useState<string>('')
  const [status, setStatus] = useState<string>('Idle')
  const [cardData, setCardData] = useState<any>(null)
  const [redeeming, setRedeeming] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedBenefits, setSelectedBenefits] = useState<string[]>([])
  const [availableBenefits, setAvailableBenefits] = useState<string[]>([])

  useEffect(()=>{
    const codeReader = new BrowserMultiFormatReader()
    let stopped = false
    async function start(){
      setStatus('Requesting camera...')
      try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices()
        const back = devices.find(d=>/back|rear|environment/i.test(d.label))?.deviceId || devices[0]?.deviceId
        if(!back) { setStatus('No camera found'); return }
        setStatus('Scanning...')
        await codeReader.decodeFromVideoDevice(back, videoRef.current!, (r)=>{
          if(stopped || !r) return
          stopped = true
          setResult(r.getText())
          setStatus('QR code detected')
        })
      } catch (e:any) {
        setStatus('Camera error: ' + e.message)
      }
    }
    start()
    return () => { 
      stopped = true
    }
  },[])

  const verify = async () => {
    if(!result) return
    setStatus('Verifying...')
    setError('')
    setSelectedBenefits([])
    
    try {
      // Extract card ID from QR code (format: CARD_123)
      const cardId = result.replace('CARD_', '')
      
      const resp = await fetch(`${API_URL}/api/cards/${cardId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      })
      
      if (!resp.ok) {
        throw new Error('Card not found or invalid')
      }
      
      const data = await resp.json()
      setCardData(data)
      
      // Parse benefits and calculate available ones
      const allBenefits = typeof data.benefits === 'string' 
        ? data.benefits.split(',').map((b: string) => b.trim())
        : data.benefits || []
      
      const redeemedBenefits = data.redeemed_benefits || []
      const available = allBenefits.filter((b: string) => !redeemedBenefits.includes(b))
      
      setAvailableBenefits(available)
      setStatus(available.length > 0 ? `${available.length} benefit(s) available` : 'All benefits used')
    } catch (err: any) {
      setError(err.message || 'Failed to verify card')
      setStatus('Verification failed')
      setCardData(null)
    }
  }

  const toggleBenefit = (benefit: string) => {
    setSelectedBenefits(prev => 
      prev.includes(benefit) 
        ? prev.filter(b => b !== benefit)
        : [...prev, benefit]
    )
  }

  const redeemCard = async () => {
    if (!cardData || availableBenefits.length === 0) return
    
    if (selectedBenefits.length === 0) {
      setError('Please select at least one benefit to redeem')
      return
    }
    
    setRedeeming(true)
    setError('')
    setSuccess('')
    
    try {
      const cardId = result.replace('CARD_', '')
      const resp = await fetch(`${API_URL}/api/admin/cards/${cardId}/redeem`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ selectedBenefits })
      })
      
      if (!resp.ok) {
        const data = await resp.json()
        throw new Error(data.error || 'Failed to redeem card')
      }
      
      const data = await resp.json()
      setSuccess(data.message || 'Benefits redeemed successfully!')
      setSelectedBenefits([])
      
      // Refresh card data
      await verify()
    } catch (err: any) {
      setError(err.message || 'Failed to redeem card')
    } finally {
      setRedeeming(false)
    }
  }

  const reset = () => {
    setResult('')
    setCardData(null)
    setStatus('Idle')
    setError('')
    setSuccess('')
    setSelectedBenefits([])
    setAvailableBenefits([])
  }

  return (
    <section className="max-w-3xl">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <QrCode size={32} />
          Scan & Verify Card
        </h2>
        <p className="text-gray-600">Scan student's QR code to verify card authenticity</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Camera size={20} />
            <h3 className="font-semibold text-gray-800">Camera View</h3>
          </div>
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full aspect-square bg-black rounded-lg border-4 border-gray-300"
          />
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700">Status: <span className="text-blue-600">{status}</span></p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-4">Verification Result</h3>
          
          {!result && (
            <div className="text-center py-12 text-gray-400">
              <QrCode size={48} className="mx-auto mb-3 opacity-50" />
              <p>Point camera at QR code</p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-800">QR Code Detected</p>
                <p className="text-xs text-blue-600 mt-1 font-mono break-all">{result}</p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800 font-medium">{success}</p>
                </div>
              )}

              {!cardData && !error && (
                <button 
                  onClick={verify} 
                  disabled={status === 'Verifying...'}
                  className="w-full text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{backgroundColor: '#003f88'}}
                  onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#002a5c')}
                  onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#003f88')}
                >
                  <CheckCircle size={20} />
                  {status === 'Verifying...' ? 'Verifying...' : 'Verify Card'}
                </button>
              )}

              {cardData && (
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl border-2 ${
                    cardData.status === 'Unused' 
                      ? 'bg-green-50 border-green-300' 
                      : 'bg-gray-50 border-gray-300'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        {cardData.status === 'Unused' ? (
                          <CheckCircle size={24} className="text-green-600" />
                        ) : (
                          <XCircle size={24} className="text-gray-600" />
                        )}
                        <p className={`font-bold ${
                          cardData.status === 'Unused' ? 'text-green-800' : 'text-gray-800'
                        }`}>
                          {status}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        cardData.status === 'Unused' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {cardData.status}
                      </span>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-2">
                        <Award className="w-4 h-4 text-gray-500 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">Package</p>
                          <p className="font-medium text-gray-900">{cardData.package_name}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Gift className="w-4 h-4 text-gray-500 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">Tier</p>
                          <p className="font-medium text-gray-900">{cardData.tier}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Calendar className="w-4 h-4 text-gray-500 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">Issued Date</p>
                          <p className="font-medium text-gray-900">
                            {new Date(cardData.issued_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {cardData.redeemed_date && (
                        <div className="flex items-start gap-2">
                          <Calendar className="w-4 h-4 text-gray-500 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs text-gray-500">Redeemed Date</p>
                            <p className="font-medium text-gray-900">
                              {new Date(cardData.redeemed_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      )}

                      <div>
                        <p className="text-xs text-gray-500 mb-2">All Benefits</p>
                        <p className="text-sm text-gray-700">{cardData.benefits}</p>
                      </div>

                      {cardData.redeemed_benefits && cardData.redeemed_benefits.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 mb-2">Already Redeemed</p>
                          <div className="space-y-1">
                            {cardData.redeemed_benefits.map((benefit: string, idx: number) => (
                              <div key={idx} className="flex items-center gap-2 text-sm text-red-600">
                                <XCircle size={14} />
                                <span className="line-through">{benefit}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {availableBenefits.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 mb-2">Available Benefits - Select to Redeem</p>
                          <div className="space-y-2">
                            {availableBenefits.map((benefit: string, idx: number) => (
                              <label key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer border border-gray-200">
                                <input
                                  type="checkbox"
                                  checked={selectedBenefits.includes(benefit)}
                                  onChange={() => toggleBenefit(benefit)}
                                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                                />
                                <span className="text-sm text-gray-700 flex-1">{benefit}</span>
                                <CheckCircle 
                                  size={16} 
                                  className={selectedBenefits.includes(benefit) ? 'text-green-600' : 'text-gray-300'}
                                />
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-2">Student Information</p>
                        <p className="font-medium text-gray-900">
                          {cardData.student_first_name} {cardData.student_last_name}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">{cardData.student_id}</p>
                        <p className="text-xs text-gray-600 font-mono mt-1">Card #{cardData.id}</p>
                      </div>
                    </div>
                  </div>

                  {availableBenefits.length > 0 && (
                    <button
                      onClick={redeemCard}
                      disabled={redeeming || selectedBenefits.length === 0}
                      className="w-full py-3 px-4 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <Gift size={20} />
                      {redeeming ? 'Redeeming...' : `Redeem Selected (${selectedBenefits.length})`}
                    </button>
                  )}

                  {availableBenefits.length === 0 && cardData.redeemed_benefits && cardData.redeemed_benefits.length > 0 && (
                    <div className="w-full py-3 px-4 bg-gray-100 text-gray-600 rounded-xl font-semibold text-center">
                      All Benefits Used
                    </div>
                  )}

                  <button 
                    onClick={reset}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-xl font-medium transition-colors"
                  >
                    Scan Another
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
