-- Create knowledge_pins table
CREATE TABLE IF NOT EXISTS knowledge_pins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    section TEXT NOT NULL CHECK (section IN ('lexicon', 'priorities', 'benchmarks', 'constraints', 'general')),
    content TEXT NOT NULL,
    created_by TEXT REFERENCES employees(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_pins_project_id ON knowledge_pins(project_id);

-- Add knowledge_base_cache to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS knowledge_base_cache JSONB;

-- Enable RLS
ALTER TABLE knowledge_pins ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- View: All members of the organization (aligned with project visibility)
CREATE POLICY "View project pins" ON knowledge_pins
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = knowledge_pins.project_id
            AND projects.organization_id = (SELECT organization_id FROM employees WHERE auth_user_id = auth.uid() LIMIT 1)
        )
    );

-- Manage: Only Managers
CREATE POLICY "Manager manage pins" ON knowledge_pins
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM employees
            WHERE auth_user_id = auth.uid()
            AND role IN ('manager', 'admin')
            AND organization_id = (SELECT organization_id FROM projects WHERE projects.id = knowledge_pins.project_id)
        )
    );
