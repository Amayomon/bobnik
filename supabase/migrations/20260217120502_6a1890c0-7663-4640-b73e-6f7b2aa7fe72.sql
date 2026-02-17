
-- Add soft-delete columns to events table
ALTER TABLE public.events
  ADD COLUMN is_deleted boolean NOT NULL DEFAULT false,
  ADD COLUMN deleted_at timestamp with time zone,
  ADD COLUMN deleted_by uuid;

-- Create index for filtering non-deleted events efficiently
CREATE INDEX idx_events_not_deleted ON public.events (room_id, created_at) WHERE is_deleted = false;

-- Update SELECT policy to only show non-deleted events
DROP POLICY "Members can view room events" ON public.events;
CREATE POLICY "Members can view room events"
  ON public.events FOR SELECT
  USING (is_room_member(auth.uid(), room_id) AND is_deleted = false);

-- Allow members to soft-delete (update is_deleted) their own events
-- The existing update policy already covers room members updating events
-- We just need to make sure deleted events can still be updated for undo
DROP POLICY "Members can update room events" ON public.events;
CREATE POLICY "Members can update room events"
  ON public.events FOR UPDATE
  USING (is_room_member(auth.uid(), room_id))
  WITH CHECK (is_room_member(auth.uid(), room_id));
