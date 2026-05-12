import { useEffect } from 'react'
import { AppProviders } from '@/app/providers/app-providers'
import { AppRouter } from '@/app/router/app-router'
import { PWAInstallPrompt } from '@/components/pwa-install-prompt'

function App() {
  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const anchor = target.closest('a')

      if (
        anchor &&
        anchor.href &&
        anchor.href.startsWith('http') &&
        !anchor.href.includes(window.location.host)
      ) {
        anchor.target = '_blank'
        anchor.rel = 'noopener noreferrer'
      }
    }

    document.addEventListener('click', handleGlobalClick)
    return () => document.removeEventListener('click', handleGlobalClick)
  }, [])

  return (
    <AppProviders>
      <AppRouter />
      <PWAInstallPrompt />
    </AppProviders>
  )
}

export default App
