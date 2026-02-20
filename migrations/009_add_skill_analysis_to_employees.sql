-- Add skill_analysis JSONB column to employees table to persist Zevian Fingerprint data
ALTER TABLE employees ADD COLUMN IF NOT EXISTS skill_analysis JSONB;

-- Update RLS if necessary (usually public read/write by manager/owner handles this, 
-- but ensuring the column is accessible)
COMMENT ON COLUMN employees.skill_analysis IS 'Persisted AI-generated skill analysis scores mapping metric IDs to proficiency values.';
