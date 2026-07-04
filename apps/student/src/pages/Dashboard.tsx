import { useState, useEffect } from 'react'
import { TrendingUp, Award, Calendar, Cloud, Sun, CloudRain, Wind, Droplets, Eye } from 'lucide-react'
import { studentStore } from '../lib/api'

interface WeatherData {
  temp: number
  feels_like: number
  humidity: number
  description: string
  icon: string
  wind_speed: number
  location: string
}

interface Stats {
  total_cards: number
  gold_cards: number
  silver_cards: number
  bronze_cards: number
  unused_cards: number
  redeemed_cards: number
  total_benefits: number
}

interface Achievement {
  id: number
  package_name: string
  tier: string
  event_type: string
  competition_level: string
  issued_date: string
  status: string
  benefits: string[]
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    total_cards: 0,
    gold_cards: 0,
    silver_cards: 0,
    bronze_cards: 0,
    unused_cards: 0,
    redeemed_cards: 0,
    total_benefits: 0
  })
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)

  const studentName = localStorage.getItem('student_name') || 'Student'
  const firstName = studentName.split(' ')[0]

  useEffect(() => {
    loadDashboardData()
    loadWeather()
  }, [])

  const loadDashboardData = async () => {
    try {
      const cards = await studentStore.getCards()
      
      // Calculate statistics
      const goldCount = cards.filter(c => c.tier === 'Gold').length
      const silverCount = cards.filter(c => c.tier === 'Silver').length
      const bronzeCount = cards.filter(c => c.tier === 'Bronze').length
      const unusedCount = cards.filter(c => c.status === 'Unused').length
      const redeemedCount = cards.filter(c => c.status === 'Redeemed').length
      const totalBenefits = cards.reduce((sum, c) => sum + (c.benefits?.length || 0), 0)

      setStats({
        total_cards: cards.length,
        gold_cards: goldCount,
        silver_cards: silverCount,
        bronze_cards: bronzeCount,
        unused_cards: unusedCount,
        redeemed_cards: redeemedCount,
        total_benefits: totalBenefits
      })

      // Sort by date for achievement timeline
      const sortedCards = [...cards].sort((a, b) => 
        new Date(b.issued_date).getTime() - new Date(a.issued_date).getTime()
      )
      setAchievements(sortedCards)
      setLoading(false)
    } catch (error) {
      console.error('Error loading dashboard:', error)
      setLoading(false)
    }
  }

  const loadWeather = async () => {
    try {
      // Using WeatherAPI.com
      const API_KEY = 'c5ccaf075c49462686b130013251711'
      const city = 'Cabuyao,Laguna,Philippines'
      const response = await fetch(
        `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${city}&aqi=no`
      )
      const data = await response.json()
      
      if (response.ok) {
        setWeather({
          temp: Math.round(data.current.temp_c),
          feels_like: Math.round(data.current.feelslike_c),
          humidity: data.current.humidity,
          description: data.current.condition.text,
          icon: data.current.condition.icon,
          wind_speed: data.current.wind_kph,
          location: data.location.name
        })
      }
    } catch (error) {
      console.error('Error fetching weather:', error)
    }
  }

  const getWeatherIcon = (description: string) => {
    const desc = description.toLowerCase()
    if (desc.includes('rain')) return <CloudRain size={40} className="text-blue-400" />
    if (desc.includes('cloud')) return <Cloud size={40} className="text-gray-400" />
    if (desc.includes('clear') || desc.includes('sun')) return <Sun size={40} className="text-yellow-400" />
    return <Cloud size={40} className="text-gray-400" />
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn px-4 sm:px-0">
      {/* Header with Weather */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 glass rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg sm:shadow-xl border border-white/20 transition-all duration-300">
          <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent mb-2 sm:mb-3">
            {getGreeting()}, {firstName}! 👋
          </h1>
          <p className="text-gray-600 text-sm sm:text-base lg:text-lg">Welcome to your incentive card dashboard</p>
        </div>

        {weather && (
          <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg sm:shadow-xl border border-white/20 transition-all duration-300">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div>
                <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-1 mb-1">
                  <Eye size={12} className="sm:w-3.5 sm:h-3.5" /> {weather.location}
                </p>
                <p className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-br from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {weather.temp}°
                </p>
                <p className="text-xs text-gray-500 mt-1">Feels like {weather.feels_like}°C</p>
              </div>
              <div className="transform transition-transform scale-75 sm:scale-100">
                {getWeatherIcon(weather.description)}
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-700 capitalize mb-2 sm:mb-3 font-medium">{weather.description}</p>
            <div className="flex gap-3 sm:gap-4 text-xs text-gray-600 bg-white/50 rounded-lg p-2">
              <span className="flex items-center gap-1">
                <Droplets size={14} className="text-blue-500" /> {weather.humidity}%
              </span>
              <span className="flex items-center gap-1">
                <Wind size={14} className="text-gray-500" /> {weather.wind_speed} kph
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Statistics Dashboard */}
      <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg sm:shadow-xl border border-white/20 transition-all duration-300">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-4 sm:mb-6 lg:mb-8 flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg sm:rounded-xl">
            <TrendingUp size={20} className="text-white sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
          </div>
          Your Statistics
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 text-white shadow-lg sm:shadow-xl transition-all duration-300 active:scale-95 sm:hover:scale-105 cursor-pointer">
            <p className="text-3xl sm:text-4xl lg:text-6xl font-bold mb-1 sm:mb-2">{stats.total_cards}</p>
            <p className="text-xs sm:text-sm opacity-90 font-medium">Total Cards</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 text-white shadow-lg sm:shadow-xl transition-all duration-300 active:scale-95 sm:hover:scale-105 cursor-pointer">
            <p className="text-3xl sm:text-4xl lg:text-6xl font-bold mb-1 sm:mb-2">{stats.gold_cards}</p>
            <p className="text-xs sm:text-sm opacity-90 font-medium">Gold Tier</p>
          </div>

          <div className="bg-gradient-to-br from-gray-400 to-gray-500 rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 text-white shadow-lg sm:shadow-xl transition-all duration-300 active:scale-95 sm:hover:scale-105 cursor-pointer">
            <p className="text-3xl sm:text-4xl lg:text-6xl font-bold mb-1 sm:mb-2">{stats.silver_cards}</p>
            <p className="text-xs sm:text-sm opacity-90 font-medium">Silver Tier</p>
          </div>

          <div className="bg-gradient-to-br from-orange-400 to-orange-500 rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 text-white shadow-lg sm:shadow-xl transition-all duration-300 active:scale-95 sm:hover:scale-105 cursor-pointer">
            <p className="text-3xl sm:text-4xl lg:text-6xl font-bold mb-1 sm:mb-2">{stats.bronze_cards}</p>
            <p className="text-xs sm:text-sm opacity-90 font-medium">Bronze Tier</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          <div className="glass border-2 border-green-200 rounded-lg sm:rounded-xl lg:rounded-2xl p-4 sm:p-5 lg:p-6 transition-all duration-300 active:scale-95 sm:hover:scale-105 cursor-pointer">
            <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-green-600 mb-1 sm:mb-2">{stats.unused_cards}</p>
            <p className="text-xs sm:text-sm text-gray-600 font-medium">Unused Cards</p>
          </div>

          <div className="glass border-2 border-blue-200 rounded-lg sm:rounded-xl lg:rounded-2xl p-4 sm:p-5 lg:p-6 transition-all duration-300 active:scale-95 sm:hover:scale-105 cursor-pointer">
            <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-blue-600 mb-1 sm:mb-2">{stats.redeemed_cards}</p>
            <p className="text-xs sm:text-sm text-gray-600 font-medium">Redeemed Cards</p>
          </div>

          <div className="glass border-2 border-purple-200 rounded-lg sm:rounded-xl lg:rounded-2xl p-4 sm:p-5 lg:p-6 transition-all duration-300 active:scale-95 sm:hover:scale-105 cursor-pointer">
            <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-purple-600 mb-1 sm:mb-2">{stats.total_benefits}</p>
            <p className="text-xs sm:text-sm text-gray-600 font-medium">Total Benefits</p>
          </div>
        </div>
      </div>

      {/* Achievement Timeline */}
      <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg sm:shadow-xl border border-white/20 transition-all duration-300">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-4 sm:mb-6 lg:mb-8 flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg sm:rounded-xl">
            <Award size={20} className="text-white sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
          </div>
          Achievement Timeline
        </h2>

        {loading ? (
          <div className="text-center py-12 sm:py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-indigo-600 border-t-transparent"></div>
            <p className="mt-4 sm:mt-6 text-gray-600 text-sm sm:text-base lg:text-lg">Loading achievements...</p>
          </div>
        ) : achievements.length === 0 ? (
          <div className="text-center py-12 sm:py-16 glass rounded-lg sm:rounded-xl border border-gray-200">
            <Award size={48} className="mx-auto text-gray-300 mb-3 sm:mb-4 sm:w-16 sm:h-16" />
            <p className="text-gray-500 text-sm sm:text-base lg:text-lg px-4">No achievements yet. Start participating in events!</p>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {achievements.map((achievement, index) => (
              <div key={achievement.id} className="relative animate-slideIn" style={{animationDelay: `${index * 0.1}s`}}>
                {/* Timeline line */}
                {index !== achievements.length - 1 && (
                  <div className="absolute left-5 sm:left-7 top-12 sm:top-16 bottom-0 w-0.5 sm:w-1 bg-indigo-300 rounded-full"></div>
                )}
                
                <div className="flex gap-3 sm:gap-6 items-start">
                  {/* Timeline dot */}
                  <div className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center shadow-lg sm:shadow-2xl transform transition-all duration-300 active:scale-95 sm:hover:scale-110 ${
                    achievement.tier === 'Gold' ? 'bg-yellow-500 ring-4 ring-yellow-200' :
                    achievement.tier === 'Silver' ? 'bg-gray-500 ring-4 ring-gray-200' :
                    'bg-orange-500 ring-2 sm:ring-4 ring-orange-200'
                  }`}>
                    <Award size={18} className="text-white sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
                  </div>

                  {/* Achievement card */}
                  <div className="flex-1 glass rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 border border-white/30 sm:border-2 transition-all duration-300 active:scale-[0.98] sm:hover:scale-[1.02] cursor-pointer">
                    <div className="flex flex-col sm:flex-row items-start justify-between mb-3 gap-2 sm:gap-0">
                      <div className="flex-1">
                        <h3 className="font-bold text-base sm:text-lg lg:text-xl text-gray-800 mb-1">{achievement.package_name}</h3>
                        <p className="text-xs sm:text-sm text-gray-600 font-medium">{achievement.event_type} • {achievement.competition_level}</p>
                      </div>
                      <div className="flex flex-row sm:flex-col items-start sm:items-end gap-2">
                        <span className={`px-2.5 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 rounded-full text-[10px] sm:text-xs font-bold shadow-md ${
                          achievement.tier === 'Gold' ? 'bg-yellow-400 text-yellow-900' :
                          achievement.tier === 'Silver' ? 'bg-gray-300 text-gray-800' :
                          'bg-orange-400 text-orange-900'
                        }`}>
                          {achievement.tier}
                        </span>
                        <span className={`px-2.5 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 rounded-full text-[10px] sm:text-xs font-bold shadow-md ${
                          achievement.status === 'Unused' ? 'bg-green-400 text-green-900' : 'bg-blue-400 text-blue-900'
                        }`}>
                          {achievement.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mb-3 sm:mb-4 bg-white/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                      <p className="text-[10px] sm:text-xs text-gray-600 font-bold uppercase mb-2 flex items-center gap-1.5 sm:gap-2">
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></span>
                        Benefits:
                      </p>
                      <ul className="text-xs sm:text-sm text-gray-700 space-y-1.5 sm:space-y-2">
                        {achievement.benefits?.map((benefit, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-green-500 text-lg font-bold">✓</span>
                            <span className="font-medium">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500 bg-white/50 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 w-fit">
                      <Calendar size={14} className="text-indigo-500 sm:w-4 sm:h-4" />
                      <span className="font-medium">Received on {formatDate(achievement.issued_date)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
