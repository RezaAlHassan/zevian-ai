-- Migration: Add selected_metrics to organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS selected_metrics TEXT[] DEFAULT '{}';
