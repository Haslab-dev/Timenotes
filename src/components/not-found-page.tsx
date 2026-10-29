import { Button } from '@/components/ui/button'
import { IconArrowLeft } from '@tabler/icons-react'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="text-center space-y-3 max-w-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Error 404
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Page not found</h1>
        <p className="text-sm text-muted-foreground">
          The page you are looking for doesn’t exist or has been moved.
        </p>
        <div className="pt-2">
          <Button variant="outline" size="sm" onClick={() => window.history.back()}>
            <IconArrowLeft className="h-4 w-4 mr-1.5" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  )
}
