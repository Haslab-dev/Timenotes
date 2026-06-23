-- Markdown documents (Obsidian-style vault)
CREATE TABLE IF NOT EXISTS markdown_docs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    source TEXT NOT NULL DEFAULT 'manual', -- manual | upload | paste
    file_key TEXT,                          -- optional R2/S3 key for the original uploaded file
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_markdown_docs_user_id ON markdown_docs(user_id);
CREATE INDEX IF NOT EXISTS idx_markdown_docs_updated_at ON markdown_docs(updated_at);

CREATE TRIGGER IF NOT EXISTS update_markdown_docs_updated_at
    AFTER UPDATE ON markdown_docs
BEGIN
    UPDATE markdown_docs SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
