
-- Add special_type to events
ALTER TABLE public.events ADD COLUMN special_type text DEFAULT NULL;

-- Add aura columns to members
ALTER TABLE public.members ADD COLUMN aura_type text DEFAULT NULL;
ALTER TABLE public.members ADD COLUMN aura_expires_at timestamptz DEFAULT NULL;
