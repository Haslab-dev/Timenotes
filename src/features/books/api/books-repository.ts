import { TursoRepository } from '@/lib/api/turso-repository'
import { tursoClient } from '@/lib/turso/turso-client'
import type {
  Book,
  BookPage,
  CreateBookRequest,
  UpdateBookRequest,
  CreatePageRequest,
  UpdatePageRequest,
} from '../types'

interface BookRow {
  id: string
  user_id: string
  title: string
  thumbnail: string | null
  created_at: string
  updated_at: string
}

interface PageRow {
  id: string
  book_id: string
  title: string
  content: string
  page_number: number
  created_at: string
  updated_at: string
}

class TursoBooksRepository extends TursoRepository<Book, BookRow> {
  protected tableName = 'books'

  protected rowToEntity(row: BookRow): Book {
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      thumbnail: row.thumbnail || undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }
  }

  async getPublicBook(id: string): Promise<Book | null> {
    const rows = await tursoClient.query<BookRow>(`SELECT * FROM ${this.tableName} WHERE id = ?`, [
      id,
    ])
    return rows.length > 0 ? this.rowToEntity(rows[0]) : null
  }

  protected entityToRow(
    entity: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>
  ): Omit<BookRow, 'id' | 'created_at' | 'updated_at'> {
    return {
      user_id: entity.userId,
      title: entity.title,
      thumbnail: entity.thumbnail || null,
    }
  }

  async getBooks(userId: string): Promise<Book[]> {
    return await this.getAll(userId)
  }

  async createBook(data: CreateBookRequest, userId: string): Promise<Book> {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    try {
      // Create the book
      await tursoClient.run(
        `INSERT INTO books (id, user_id, title, thumbnail, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, userId, data.title, data.thumbnail || null, now, now]
      )

      // Create the first page automatically
      const pageId = crypto.randomUUID()
      await tursoClient.run(
        `INSERT INTO book_pages (id, book_id, title, content, page_number, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [pageId, id, 'Page 1', '[]', 1, now, now]
      )

      const book = await this.getById(id, userId)
      if (!book) throw new Error('Failed to fetch created book')
      return book
    } catch (error) {
      console.error('Error creating book:', error)
      throw error
    }
  }

  async updateBook(id: string, userId: string, data: UpdateBookRequest): Promise<Book | null> {
    const updates: string[] = []
    const params: any[] = []

    if (data.title !== undefined) {
      updates.push('title = ?')
      params.push(data.title)
    }
    if (data.thumbnail !== undefined) {
      updates.push('thumbnail = ?')
      params.push(data.thumbnail)
    }

    if (updates.length === 0) return await this.getById(id, userId)

    updates.push('updated_at = ?')
    params.push(new Date().toISOString())
    params.push(id, userId)

    await tursoClient.run(
      `UPDATE books SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
      params
    )

    return await this.getById(id, userId)
  }

  // Page methods
  async getPages(bookId: string): Promise<BookPage[]> {
    try {
      const rows = await tursoClient.query<PageRow>(
        'SELECT * FROM book_pages WHERE book_id = ? ORDER BY page_number ASC',
        [bookId]
      )
      return rows.map((row) => ({
        id: row.id,
        bookId: row.book_id,
        title: row.title,
        content: row.content,
        pageNumber: row.page_number,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }))
    } catch (error) {
      console.error('Error fetching book pages:', error)
      return []
    }
  }

  async createPage(data: CreatePageRequest): Promise<BookPage> {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    try {
      await tursoClient.run(
        `INSERT INTO book_pages (id, book_id, title, content, page_number, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, data.bookId, data.title, data.content, data.pageNumber, now, now]
      )

      const rows = await tursoClient.query<PageRow>('SELECT * FROM book_pages WHERE id = ?', [id])
      const row = rows[0]
      if (!row) throw new Error('Failed to fetch created page')

      return {
        id: row.id,
        bookId: row.book_id,
        title: row.title,
        content: row.content,
        pageNumber: row.page_number,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }
    } catch (error) {
      console.error('Error creating page:', error)
      throw error
    }
  }

  async updatePage(id: string, data: UpdatePageRequest): Promise<BookPage | null> {
    const updates: string[] = []
    const params: any[] = []

    if (data.title !== undefined) {
      updates.push('title = ?')
      params.push(data.title)
    }
    if (data.content !== undefined) {
      updates.push('content = ?')
      params.push(data.content)
    }
    if (data.pageNumber !== undefined) {
      updates.push('page_number = ?')
      params.push(data.pageNumber)
    }

    if (updates.length === 0) return null

    updates.push('updated_at = ?')
    params.push(new Date().toISOString())
    params.push(id)

    await tursoClient.run(`UPDATE book_pages SET ${updates.join(', ')} WHERE id = ?`, params)

    const rows = await tursoClient.query<PageRow>('SELECT * FROM book_pages WHERE id = ?', [id])
    const row = rows[0]
    return row
      ? {
          id: row.id,
          bookId: row.book_id,
          title: row.title,
          content: row.content,
          pageNumber: row.page_number,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
        }
      : null
  }

  async deleteBook(id: string, userId: string): Promise<boolean> {
    // book_pages should be deleted by CASCADE in SQL, but we'll be safe
    await tursoClient.run('DELETE FROM book_pages WHERE book_id = ?', [id])
    const result = await tursoClient.run('DELETE FROM books WHERE id = ? AND user_id = ?', [
      id,
      userId,
    ])
    return result.changes > 0
  }
}

export const booksRepository = new TursoBooksRepository()
