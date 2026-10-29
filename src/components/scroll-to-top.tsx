import { useState, useEffect } from 'react'
import { IconArrowUp } from '@tabler/icons-react'
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
      className="fixed bottom-20 right-5 h-10 w-10 rounded-full shadow-md z-[100] animate-in fade-in zoom-in duration-200 cursor-pointer"
      onClick={scrollToTop}
    >
      <IconArrowUp className="h-5 w-5" />
    </Button>
  )
}
