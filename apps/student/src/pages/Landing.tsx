import { useNavigate } from 'react-router-dom'
import { Award, Trophy, CreditCard, Gift, ArrowRight } from 'lucide-react'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col">
      {/* Main Content - Single Page */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-6xl w-full">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Side - Content */}
            <div className="space-y-6 text-center md:text-left">
              {/* Logos */}
              <div className="flex items-center justify-center md:justify-start gap-4 mb-6">
                <img src="images/PNC_logo.png" alt="PNC Logo" className="h-16 w-auto object-contain" />
                <img src="images/COE-logo.jpg" alt="COE Logo" className="h-16 w-16 object-cover rounded-full shadow-lg" />
              </div>

              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold border border-blue-200">
                <Award size={16} />
                Student Achievement Portal
              </div>

              {/* Heading */}
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Incentive Management Card
                  </span>
                </h1>
                <p className="text-lg text-gray-600">
                  Track your achievements, view your rewards, and redeem exclusive benefits
                </p>
              </div>

              {/* Features List */}
              <div className="space-y-3 py-4">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-2 rounded-lg">
                    <CreditCard className="text-blue-600" size={20} />
                  </div>
                  <span className="text-gray-700 font-medium">Digital Achievement Cards</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-green-100 to-green-200 p-2 rounded-lg">
                    <Trophy className="text-green-600" size={20} />
                  </div>
                  <span className="text-gray-700 font-medium">Track Your Progress</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-2 rounded-lg">
                    <Gift className="text-purple-600" size={20} />
                  </div>
                  <span className="text-gray-700 font-medium">Redeem Exclusive Benefits</span>
                </div>
              </div>

              {/* CTA Button */}
              <div>
                <button
                  onClick={() => navigate('/login')}
                  className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Get Started
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                </button>
              </div>
            </div>

            {/* Right Side - Cards Preview */}
            <div className="hidden md:block relative h-96">
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Gold Card */}
                <div className="absolute top-12 left-0 w-80 h-48 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-2xl p-6 text-white transform rotate-6 hover:rotate-3 transition-all duration-300 hover:scale-105 cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <Award className="opacity-80" size={40} />
                    <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">GOLD TIER</span>
                  </div>
                  <h3 className="text-xl font-bold mt-6">Achievement Card</h3>
                  <p className="text-xs opacity-90 mt-2">Unlock exclusive benefits and rewards</p>
                </div>

                {/* Silver Card */}
                <div className="absolute top-24 right-0 w-80 h-48 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-2xl p-6 text-white transform -rotate-6 hover:-rotate-3 transition-all duration-300 hover:scale-105 cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <Trophy className="opacity-80" size={40} />
                    <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">SILVER TIER</span>
                  </div>
                  <h3 className="text-xl font-bold mt-6">Competition Winner</h3>
                  <p className="text-xs opacity-90 mt-2">Recognized for excellence</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/80 backdrop-blur-sm py-6">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="font-medium text-gray-700">College of Engineering — University of Cabuyao</p>
          <p className="text-sm text-gray-400 mt-1">Developed by Engr. Carlo</p>
        </div>
      </footer>
    </div>
  )
}
