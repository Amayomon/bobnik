
-- Drop all existing RESTRICTIVE policies and recreate as PERMISSIVE

-- ROOMS
DROP POLICY IF EXISTS "Authenticated users can create rooms" ON public.rooms;
DROP POLICY IF EXISTS "Members can view rooms" ON public.rooms;

CREATE POLICY "Authenticated users can create rooms"
ON public.rooms FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Members can view rooms"
ON public.rooms FOR SELECT
TO authenticated
USING (is_room_member(auth.uid(), id));

-- MEMBERS
DROP POLICY IF EXISTS "Members can view room members" ON public.members;
DROP POLICY IF EXISTS "Users can add themselves" ON public.members;
DROP POLICY IF EXISTS "Users can update own member" ON public.members;

CREATE POLICY "Members can view room members"
ON public.members FOR SELECT
TO authenticated
USING (is_room_member(auth.uid(), room_id));

CREATE POLICY "Users can add themselves"
ON public.members FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own member"
ON public.members FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- EVENTS
DROP POLICY IF EXISTS "Members can view room events" ON public.events;
DROP POLICY IF EXISTS "Members can insert events for themselves" ON public.events;
DROP POLICY IF EXISTS "Members can delete own events" ON public.events;

CREATE POLICY "Members can view room events"
ON public.events FOR SELECT
TO authenticated
USING (is_room_member(auth.uid(), room_id));

CREATE POLICY "Members can insert events for themselves"
ON public.events FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM members
  WHERE members.id = events.member_id AND members.user_id = auth.uid()
));

CREATE POLICY "Members can delete own events"
ON public.events FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM members
  WHERE members.id = events.member_id AND members.user_id = auth.uid()
));

-- PROFILES
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);
