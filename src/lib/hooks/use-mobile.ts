import { useState, useEffect } from 'react'

const MOBILE_BREAKPOINT = 768

function getIsMobile() {
  if (typeof window === 'undefined') return false
  return window.innerWidth < MOBILE_BREAKPOINT
}

export function useIsMobile() {
  // Initialize synchronously so the first render already knows the correct state.
  // This prevents the false→true flash that causes redirect loops in route components.
  const [isMobile, setIsMobile] = useState(getIsMobile)

  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  return isMobile
}
