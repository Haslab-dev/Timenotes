import { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/lib/hooks/use-mobile'

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false)
  const isMobile = useIsMobile()

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', toggleVisibility)
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  if (!isMobile || !isVisible) return null

  return (
    <Button
      variant="default"
      size="icon"
      className="fixed bottom-20 right-6 h-12 w-12 rounded-full shadow-2xl shadow-primary/40 z-[100] animate-in fade-in zoom-in slide-in-from-bottom-4 duration-300 ring-2 ring-white dark:ring-zinc-900 cursor-pointer"
      onClick={scrollToTop}
    >
      <ArrowUp className="h-6 w-6" />
    </Button>
  )
}
