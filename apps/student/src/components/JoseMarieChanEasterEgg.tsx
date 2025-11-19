import { useEffect, useState } from 'react'

export function JoseMarieChanEasterEgg() {
  const [show, setShow] = useState(false)
  const [animationState, setAnimationState] = useState<'hidden' | 'peeking' | 'retreating'>('hidden')

  useEffect(() => {
    // Generate random number from 1 to 100
    const randomNum = Math.floor(Math.random() * 100) + 1
    console.log('Jose Marie Chan roll:', randomNum)

    // Show if 51-100 (50% chance)
    if (randomNum >= 51) {
      // Delay before showing
      setTimeout(() => {
        setShow(true)
        setAnimationState('peeking')

        // Start retreating after 4 seconds
        setTimeout(() => {
          setAnimationState('retreating')

          // Hide completely after retreat animation
          setTimeout(() => {
            setShow(false)
            setAnimationState('hidden')
          }, 4000)
        }, 4000)
      }, 1000) // Initial delay of 1 second
    }
  }, [])

  if (!show) return null

  return (
    <div className="fixed bottom-0 left-0 z-50 pointer-events-none">
      <img
        src="/images/jose-marie-chan.png"
        alt=""
        className={`h-64 w-auto transition-transform duration-[4000ms] ease-in-out ${
          animationState === 'peeking' ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          mixBlendMode: 'normal',
        }}
      />
    </div>
  )
}
