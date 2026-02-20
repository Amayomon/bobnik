
-- Add special phenomena boolean columns to events table
ALTER TABLE public.events ADD COLUMN neptunes_touch boolean NOT NULL DEFAULT false;
ALTER TABLE public.events ADD COLUMN phantom_cone boolean NOT NULL DEFAULT false;
