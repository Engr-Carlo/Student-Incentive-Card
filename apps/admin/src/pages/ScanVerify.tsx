/// <reference types="vite/client" />
import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { QrCode, CheckCircle, XCircle, Camera } from 'lucide-react'

export default function ScanVerify(){
  const videoRef = useRef<HTMLVideoElement|null>(null)
  const [result, setResult] = useState<string>('')
  const [status, setStatus] = useState<string>('Idle')
  const [verifyData, setVerifyData] = useState<any>(null)

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
    const resp = await fetch(import.meta.env.VITE_API_BASE + '/admin/verify', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ qr_payload: result })
    })
    const data = await resp.json()
    setVerifyData(data)
    setStatus(data.valid ? 'Valid card' : 'Invalid card')
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

          {result && !verifyData && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-800">QR Code Detected</p>
                <p className="text-xs text-blue-600 mt-1 font-mono break-all">{result.substring(0, 50)}...</p>
              </div>
              <button 
                onClick={verify} 
                className="w-full text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                style={{backgroundColor: '#003f88'}}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#002a5c'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#003f88'}
              >
                <CheckCircle size={20} />
                Verify Card
              </button>
            </div>
          )}

          {verifyData && (
            <div className={`p-6 rounded-xl border-2 ${
              verifyData.valid 
                ? 'bg-green-50 border-green-300' 
                : 'bg-red-50 border-red-300'
            }`}>
              <div className="flex items-center gap-3 mb-4">
                {verifyData.valid ? (
                  <CheckCircle size={32} className="text-green-600" />
                ) : (
                  <XCircle size={32} className="text-red-600" />
                )}
                <div>
                  <p className={`font-bold text-lg ${
                    verifyData.valid ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {verifyData.valid ? 'Valid Card' : 'Invalid Card'}
                  </p>
                  <p className={`text-sm ${
                    verifyData.valid ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {verifyData.valid ? 'This card is authentic' : verifyData.reason || 'Verification failed'}
                  </p>
                </div>
              </div>
              
              {verifyData.valid && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Card ID:</span>
                    <span className="font-mono font-semibold">{verifyData.card_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-semibold ${
                      verifyData.status === 'Unused' ? 'text-green-600' : 'text-gray-600'
                    }`}>{verifyData.status}</span>
                  </div>
                </div>
              )}

              <button 
                onClick={() => {setResult(''); setVerifyData(null); setStatus('Idle')}}
                className="w-full mt-4 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Scan Another
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
