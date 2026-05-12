export type Book = {
  id: string
  userId: string
  title: string
  thumbnail?: string
  createdAt: Date
  updatedAt: Date
}

export type BookPage = {
  id: string
  bookId: string
  title: string
  content: string // JSON string for BlockNote or HTML/Markdown
  pageNumber: number
  createdAt: Date
  updatedAt: Date
}

export type CreateBookRequest = {
  title: string
  thumbnail?: string
}

export type UpdateBookRequest = {
  title?: string
  thumbnail?: string
}

export type CreatePageRequest = {
  bookId: string
  title: string
  content: string
  pageNumber: number
}

export type UpdatePageRequest = {
  title?: string
  content?: string
  pageNumber?: number
}
