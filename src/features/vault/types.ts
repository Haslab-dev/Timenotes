export type MarkdownDocSource = 'manual' | 'upload' | 'paste'

export type MarkdownDoc = {
  id: string
  userId: string
  projectId?: string | null
  title: string
  content: string
  source: MarkdownDocSource
  fileKey?: string | null
  createdAt: Date
  updatedAt: Date
}

export type CreateMarkdownDocRequest = {
  title: string
  content: string
  source?: MarkdownDocSource
  projectId?: string | null
  fileKey?: string | null
}

export type UpdateMarkdownDocRequest = {
  title?: string
  content?: string
  projectId?: string | null
  fileKey?: string | null
}
