import './App.css'

import { AppProviders } from '@/app/providers/app-providers'
import { AppRouter } from '@/app/router/app-router'
import { PWAInstallPrompt } from '@/components/pwa-install-prompt'

function App() {
  return (
    <AppProviders>
      <AppRouter />
      <PWAInstallPrompt />
    </AppProviders>
  )
}

export default App
