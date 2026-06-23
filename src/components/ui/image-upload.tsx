import { Image as ImageIcon, Loader2, Upload } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useImageUpload } from '@/components/ui/use-image-upload'
import {
  IMAGE_QUALITY_OPTIONS,
  compressImage,
  formatBytes,
  type ImageQuality,
} from '@/lib/utils/image-compress'

interface ImageUploadPopoverProps {
  onUploaded: (url: string, fileName: string) => void
  trigger?: ReactNode
  align?: 'start' | 'center' | 'end'
  defaultQuality?: ImageQuality
}

export function ImageUploadPopover({
  onUploaded,
  trigger,
  align = 'start',
  defaultQuality = 75,
}: ImageUploadPopoverProps) {
  const { upload, uploading, configured } = useImageUpload()
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [quality, setQuality] = useState<ImageQuality>(defaultQuality)
  const [compressed, setCompressed] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  useEffect(() => {
    let cancelled = false
    if (!file) {
      setCompressed(null)
      return
    }
    compressImage(file, quality).then((result) => {
      if (!cancelled) setCompressed(result)
    })
    return () => {
      cancelled = true
    }
  }, [file, quality])

  const reset = () => {
    setFile(null)
    setCompressed(null)
    setError(null)
  }

  const handleUpload = async () => {
    if (!file) return
    setError(null)
    const url = await upload(file, quality)
    if (url) {
      onUploaded(url, file.name)
      setOpen(false)
      reset()
    } else {
      setError(
        configured
          ? 'Upload failed. Check your R2 bucket CORS settings.'
          : 'S3/R2 is not configured. Set the VITE_S3_* env vars.'
      )
    }
  }

  const reduction =
    file && compressed && compressed.size < file.size
      ? Math.round((1 - compressed.size / file.size) * 100)
      : 0

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <PopoverTrigger asChild>
        {trigger ?? (
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
            <ImageIcon className="h-4 w-4" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent align={align} className="w-72 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold">Upload image</span>
        </div>

        {!configured && (
          <p className="text-[11px] text-amber-600 dark:text-amber-500 leading-snug">
            S3/R2 not configured — uploads are disabled.
          </p>
        )}

        <label className="flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed p-4 cursor-pointer hover:bg-accent/40 transition-colors text-center">
          <Upload className="h-5 w-5 text-muted-foreground" />
          <span className="text-xs font-medium">
            {file ? 'Choose another image' : 'Click to choose an image'}
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null)
              setError(null)
              e.target.value = ''
            }}
          />
        </label>

        {previewUrl && file && (
          <div className="flex items-center gap-3">
            <img
              src={previewUrl}
              alt={file.name}
              className="h-14 w-14 rounded-lg object-cover border"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate">{file.name}</p>
              <p className="text-[10px] text-muted-foreground">
                Original: {formatBytes(file.size)}
              </p>
              {quality < 100 && compressed ? (
                <p className="text-[10px] text-emerald-600 dark:text-emerald-500 font-medium">
                  Compressed: {formatBytes(compressed.size)}
                  {reduction > 0 ? ` (−${reduction}%)` : ''}
                </p>
              ) : (
                <p className="text-[10px] text-muted-foreground">No compression</p>
              )}
            </div>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Compression
          </label>
          <Select
            value={String(quality)}
            onValueChange={(value) => setQuality(Number(value) as ImageQuality)}
          >
            <SelectTrigger className="h-9 rounded-lg text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              {IMAGE_QUALITY_OPTIONS.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}%{option === 100 ? ' (original)' : ' quality'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="button"
          className="w-full rounded-lg h-9"
          disabled={!file || uploading || !configured}
          onClick={handleUpload}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Upload className="h-4 w-4 mr-2" />
          )}
          Upload
        </Button>

        {error && <p className="text-[11px] text-destructive">{error}</p>}
      </PopoverContent>
    </Popover>
  )
}
