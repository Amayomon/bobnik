
-- Create a SECURITY DEFINER function for soft-deleting events.
-- It validates that the caller is either:
--   1. The member who owns the event (member.user_id = auth.uid()), OR
--   2. The room creator (rooms.created_by = auth.uid())
-- AND that the event belongs to the given room (cross-room protection).

CREATE OR REPLACE FUNCTION public.soft_delete_event(
  _event_id uuid,
  _room_id  uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member_user_id uuid;
  v_room_created_by uuid;
  v_event_room_id   uuid;
BEGIN
  -- 1. Fetch the event's actual room_id (cross-room guard)
  SELECT room_id INTO v_event_room_id
  FROM public.events
  WHERE id = _event_id AND is_deleted = false;

  IF v_event_room_id IS NULL THEN
    RAISE EXCEPTION 'Event not found or already deleted';
  END IF;

  IF v_event_room_id <> _room_id THEN
    RAISE EXCEPTION 'Event does not belong to the specified room';
  END IF;

  -- 2. Check caller is a member of this room
  IF NOT public.is_room_member(auth.uid(), _room_id) THEN
    RAISE EXCEPTION 'Access denied: not a room member';
  END IF;

  -- 3. Get the member user_id who owns this event
  SELECT m.user_id INTO v_member_user_id
  FROM public.events e
  JOIN public.members m ON m.id = e.member_id
  WHERE e.id = _event_id;

  -- 4. Get room creator
  SELECT created_by INTO v_room_created_by
  FROM public.rooms
  WHERE id = _room_id;

  -- 5. Authorize: owner of the event OR room creator
  IF auth.uid() <> v_member_user_id AND auth.uid() <> v_room_created_by THEN
    RAISE EXCEPTION 'Access denied: not the event owner or room creator';
  END IF;

  -- 6. Perform soft delete
  UPDATE public.events
  SET
    is_deleted = true,
    deleted_at = now(),
    deleted_by = auth.uid()
  WHERE id = _event_id;
END;
$$;

-- Also create an undo function (restores a soft-deleted event with the same permission check)
CREATE OR REPLACE FUNCTION public.restore_deleted_event(
  _event_id uuid,
  _room_id  uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member_user_id  uuid;
  v_room_created_by uuid;
  v_event_room_id   uuid;
BEGIN
  -- Fetch the event (including deleted ones)
  SELECT room_id INTO v_event_room_id
  FROM public.events
  WHERE id = _event_id;

  IF v_event_room_id IS NULL THEN
    RAISE EXCEPTION 'Event not found';
  END IF;

  IF v_event_room_id <> _room_id THEN
    RAISE EXCEPTION 'Event does not belong to the specified room';
  END IF;

  IF NOT public.is_room_member(auth.uid(), _room_id) THEN
    RAISE EXCEPTION 'Access denied: not a room member';
  END IF;

  SELECT m.user_id INTO v_member_user_id
  FROM public.events e
  JOIN public.members m ON m.id = e.member_id
  WHERE e.id = _event_id;

  SELECT created_by INTO v_room_created_by
  FROM public.rooms
  WHERE id = _room_id;

  IF auth.uid() <> v_member_user_id AND auth.uid() <> v_room_created_by THEN
    RAISE EXCEPTION 'Access denied: not the event owner or room creator';
  END IF;

  UPDATE public.events
  SET
    is_deleted = false,
    deleted_at = null,
    deleted_by = null
  WHERE id = _event_id;
END;
$$;
