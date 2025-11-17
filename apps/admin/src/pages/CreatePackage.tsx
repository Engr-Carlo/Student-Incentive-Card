import { useState } from 'react'
import { Package, Trophy, Award, Tag } from 'lucide-react'
import { adminStore } from '../lib/api'

export default function CreatePackage(){
  const [name, setName] = useState('')
  const [tier, setTier] = useState<'Bronze' | 'Silver' | 'Gold'>('Bronze')
  const [eventType, setEventType] = useState('')
  const [competitionLevel, setCompetitionLevel] = useState('')
  const [benefits, setBenefits] = useState<string[]>([''])
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const addBenefit = () => {
    setBenefits([...benefits, ''])
  }

  const updateBenefit = (index: number, value: string) => {
    const updated = [...benefits]
    updated[index] = value
    setBenefits(updated)
  }

  const removeBenefit = (index: number) => {
    setBenefits(benefits.filter((_, i) => i !== index))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    const filteredBenefits = benefits.filter(b => b.trim() !== '')
    
    try {
      await adminStore.createPackage(name, tier, eventType, competitionLevel, filteredBenefits)
      setSuccess(true)
      setTimeout(() => {
        setName('')
        setTier('Bronze')
        setEventType('')
        setCompetitionLevel('')
        setBenefits([''])
        setSuccess(false)
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to create package')
    }
  }

  return (
    <section className="max-w-3xl">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Create Package</h2>
        <p className="text-gray-600">Create a reusable incentive package for events and competitions</p>
      </div>

      <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200">
        <form onSubmit={submit} className="space-y-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold mb-2 text-gray-700">
              <Tag size={16} />
              Package Name
            </label>
            <input 
              className="w-full border-2 border-gray-200 rounded-xl p-3 focus:ring-2 focus:border-transparent transition-all duration-200" 
              style={{'--tw-ring-color': '#003f88'} as React.CSSProperties}
              placeholder="e.g., Chess Tournament Package" 
              value={name} 
              onChange={e=>setName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold mb-2 text-gray-700">
                <Trophy size={16} />
                Event Type
              </label>
              <input 
                className="w-full border-2 border-gray-200 rounded-xl p-3 focus:ring-2 focus:border-transparent transition-all duration-200" 
                style={{'--tw-ring-color': '#003f88'} as React.CSSProperties}
                placeholder="e.g., Chess, Programming, Hackathon" 
                value={eventType} 
                onChange={e=>setEventType(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold mb-2 text-gray-700">
                <Award size={16} />
                Competition Level
              </label>
              <select 
                className="w-full border-2 border-gray-200 rounded-xl p-3 focus:ring-2 focus:border-transparent transition-all duration-200 bg-white" 
                style={{'--tw-ring-color': '#003f88'} as React.CSSProperties}
                value={competitionLevel} 
                onChange={e=>setCompetitionLevel(e.target.value)}
                required
              >
                <option value="">-- Select Level --</option>
                <option value="Local">Local</option>
                <option value="Regional">Regional</option>
                <option value="National">National</option>
                <option value="International">International</option>
              </select>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-semibold mb-2 text-gray-700">
              <Award size={16} />
              Tier Level (Determines Benefits)
            </label>
            <select 
              className="w-full border-2 border-gray-200 rounded-xl p-3 focus:ring-2 focus:border-transparent transition-all duration-200 bg-white" 
              style={{'--tw-ring-color': '#003f88'} as React.CSSProperties}
              value={tier} 
              onChange={e=>setTier(e.target.value as 'Bronze' | 'Silver' | 'Gold')}
            >
              <option>Bronze</option>
              <option>Silver</option>
              <option>Gold</option>
            </select>
          </div>

          <div>
            <label className="flex items-center justify-between text-sm font-semibold mb-2 text-gray-700">
              <span className="flex items-center gap-2">
                <Package size={16} />
                Benefits
              </span>
              <button
                type="button"
                onClick={addBenefit}
                className="text-xs px-3 py-1 rounded-lg text-white"
                style={{backgroundColor: '#003f88'}}
              >
                + Add Benefit
              </button>
            </label>
            <div className="space-y-3">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex gap-2">
                  <input 
                    className="flex-1 border-2 border-gray-200 rounded-xl p-3 focus:ring-2 focus:border-transparent transition-all duration-200" 
                    style={{'--tw-ring-color': '#003f88'} as React.CSSProperties}
                    placeholder={`Benefit ${index + 1} (e.g., 1 Quiz Exemption)`}
                    value={benefit} 
                    onChange={e=>updateBenefit(index, e.target.value)}
                  />
                  {benefits.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeBenefit(index)}
                      className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button 
            type="submit"
            className="w-full text-white py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-2"
            style={{backgroundColor: '#003f88'}}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#002a5c')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#003f88')}
          >
            <Package size={20} />
            Create Package
          </button>
        </form>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-300 rounded-xl">
            <p className="font-semibold text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mt-6 p-4 bg-green-50 border border-green-300 rounded-xl">
            <p className="font-semibold text-green-800">Package created successfully!</p>
          </div>
        )}
      </div>
    </section>
  )
}
