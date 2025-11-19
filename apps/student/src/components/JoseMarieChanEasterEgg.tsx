import { useEffect, useState } from 'react'

export function JoseMarieChanEasterEgg() {
  const [show, setShow] = useState(false)
  const [animationState, setAnimationState] = useState<'hidden' | 'peeking' | 'retreating'>('hidden')

  useEffect(() => {
    // Generate random number from 1 to 100
    const randomNum = Math.floor(Math.random() * 100) + 1
    console.log('🎄 Jose Marie Chan roll:', randomNum)

    // Show if 51-100 (50% chance)
    if (randomNum >= 51) {
      // Delay before showing
      setTimeout(() => {
        setShow(true)
        setAnimationState('peeking')

        // Start retreating after 3 seconds
        setTimeout(() => {
          setAnimationState('retreating')

          // Hide completely after retreat animation
          setTimeout(() => {
            setShow(false)
            setAnimationState('hidden')
          }, 2000)
        }, 3000)
      }, 1000) // Initial delay of 1 second
    }
  }, [])

  if (!show) return null

  return (
    <div className="fixed bottom-0 left-0 z-50 pointer-events-none">
      <img
        src="/images/jose-marie-chan.png"
        alt="Jose Marie Chan"
        className={`h-64 w-auto transition-transform duration-[2000ms] ease-in-out ${
          animationState === 'peeking' ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          filter: 'drop-shadow(4px 4px 8px rgba(0,0,0,0.3))',
        }}
      />
      {animationState === 'peeking' && (
        <div className="absolute top-4 left-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg animate-bounce">
          <p className="text-sm font-bold">🎄 It's Christmas time! 🎅</p>
        </div>
      )}
    </div>
  )
}
