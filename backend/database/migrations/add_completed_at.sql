-- Migration: Add completed_at column to todos table
-- Purpose: Track when each todo was completed (required for Story 6.1 stats)
-- Run this in Supabase SQL Editor before deploying backend changes.

ALTER TABLE todos ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
COMMENT ON COLUMN todos.completed_at IS 'Timestamp when the todo was marked as completed. NULL for incomplete todos.';

CREATE INDEX IF NOT EXISTS idx_todos_completed_at ON todos(user_id, completed_at)
    WHERE completed_at IS NOT NULL;
