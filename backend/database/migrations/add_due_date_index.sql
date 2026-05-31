-- Migration: Add due_date index to todos table
-- Purpose: Improve dashboard query performance (NFR-1: < 1s load time)
-- Run this in Supabase SQL Editor or via migration tool

CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);
