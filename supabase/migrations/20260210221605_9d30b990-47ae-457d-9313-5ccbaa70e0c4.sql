
-- Add rating columns to events table
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS consistency int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS smell int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS size int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS effort int NOT NULL DEFAULT 0;

-- Add check constraints for range -3..+3
ALTER TABLE public.events
  ADD CONSTRAINT events_consistency_range CHECK (consistency BETWEEN -3 AND 3),
  ADD CONSTRAINT events_smell_range CHECK (smell BETWEEN -3 AND 3),
  ADD CONSTRAINT events_size_range CHECK (size BETWEEN -3 AND 3),
  ADD CONSTRAINT events_effort_range CHECK (effort BETWEEN -3 AND 3);

-- Allow room members to UPDATE events (for saving ratings)
CREATE POLICY "Members can update room events"
  ON public.events
  FOR UPDATE
  USING (is_room_member(auth.uid(), room_id))
  WITH CHECK (is_room_member(auth.uid(), room_id));
