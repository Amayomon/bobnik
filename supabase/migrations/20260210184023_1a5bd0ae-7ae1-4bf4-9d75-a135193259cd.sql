
-- Add optional source column to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual';
