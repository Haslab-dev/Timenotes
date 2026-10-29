import { useEffect, useState } from 'react'
import { IconDownload, IconX } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    await deferredPrompt.userChoice

    setDeferredPrompt(null)
    setIsVisible(false)
  }

  const handleDismiss = () => {
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:w-80 z-50 animate-in fade-in slide-in-from-bottom-6 duration-300">
      <div className="bg-card rounded-xl shadow-lg border border-border p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-primary-foreground shrink-0">
              <IconDownload className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Install TimeNotes</h3>
              <p className="text-xs text-muted-foreground">
                Add to your home screen for quick access.
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 cursor-pointer"
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleInstallClick} className="flex-1">
            Install
          </Button>
          <Button size="sm" variant="outline" onClick={handleDismiss}>
            Later
          </Button>
        </div>
      </div>
    </div>
  )
}
