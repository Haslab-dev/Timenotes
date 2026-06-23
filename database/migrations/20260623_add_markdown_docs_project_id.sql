-- Add optional project relation to markdown documents
ALTER TABLE markdown_docs ADD COLUMN project_id TEXT REFERENCES projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_markdown_docs_project_id ON markdown_docs(project_id);
