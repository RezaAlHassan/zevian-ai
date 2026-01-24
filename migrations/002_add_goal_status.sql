
-- Add status column to goals table
ALTER TABLE goals ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed'));

-- Add index for status
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
