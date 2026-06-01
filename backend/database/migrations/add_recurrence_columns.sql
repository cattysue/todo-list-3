ALTER TABLE todos
  ADD COLUMN IF NOT EXISTS recurrence_type TEXT
    CHECK (recurrence_type IN ('daily', 'weekly', 'monthly'));

ALTER TABLE todos
  ADD COLUMN IF NOT EXISTS recurrence_days TEXT;

ALTER TABLE todos
  ADD COLUMN IF NOT EXISTS recurrence_day_of_month INTEGER;
