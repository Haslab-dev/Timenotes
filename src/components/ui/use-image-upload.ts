import { useCallback, useState } from 'react'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { buildGenericAttachmentKey, getS3Client, isS3Configured } from '@/lib/s3/s3-client'
import { compressImage, type ImageQuality } from '@/lib/utils/image-compress'

export function useImageUpload() {
  const { data: user } = useAuth()
  const [uploading, setUploading] = useState(false)

  const upload = useCallback(
    async (file: File, quality: ImageQuality): Promise<string | null> => {
      const s3 = getS3Client()
      if (!s3 || !user?.id) return null
      setUploading(true)
      try {
        const compressed = await compressImage(file, quality)
        const key = buildGenericAttachmentKey(user.id, compressed.name)
        const contentType = compressed.type || 'application/octet-stream'
        return await s3.putObject(key, compressed, contentType)
      } catch (err) {
        console.error('Image upload failed:', err)
        return null
      } finally {
        setUploading(false)
      }
    },
    [user?.id]
  )

  return { upload, uploading, configured: isS3Configured() }
}
