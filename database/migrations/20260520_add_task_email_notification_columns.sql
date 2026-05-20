-- Add email notification tracking fields for task scheduler
ALTER TABLE tasks ADD COLUMN email_reminder_sent_at DATETIME;
ALTER TABLE tasks ADD COLUMN email_due_sent_at DATETIME;
ALTER TABLE tasks ADD COLUMN email_last_error TEXT;

CREATE INDEX IF NOT EXISTS idx_tasks_email_due_sent_at ON tasks(email_due_sent_at);
CREATE INDEX IF NOT EXISTS idx_tasks_email_reminder_sent_at ON tasks(email_reminder_sent_at);
