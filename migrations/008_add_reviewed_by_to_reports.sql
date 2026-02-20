-- Migration: Add reviewed_by field to reports table
-- Description: This field stores the employee ID of the manager who reviewed the report and potentially overrode the AI score.

ALTER TABLE reports ADD COLUMN IF NOT EXISTS reviewed_by TEXT REFERENCES employees(id) ON DELETE SET NULL;

-- Index for performance when joining/filtering by manager
CREATE INDEX IF NOT EXISTS idx_reports_reviewed_by ON reports(reviewed_by);
