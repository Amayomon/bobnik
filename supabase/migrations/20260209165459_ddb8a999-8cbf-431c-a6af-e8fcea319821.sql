
-- Profiles table for user display info
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Rooms
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE DEFAULT substr(md5(random()::text), 1, 6),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Members
CREATE TABLE public.members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '💩',
  color TEXT NOT NULL DEFAULT 'hsl(28, 70%, 48%)',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- Events
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Helper: check if user is member of a room (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.is_room_member(_user_id UUID, _room_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.members WHERE user_id = _user_id AND room_id = _room_id
  );
$$;

-- Room policies: only members can see their rooms
CREATE POLICY "Members can view rooms" ON public.rooms FOR SELECT
  USING (public.is_room_member(auth.uid(), id));
CREATE POLICY "Authenticated users can create rooms" ON public.rooms FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Member policies
CREATE POLICY "Members can view room members" ON public.members FOR SELECT
  USING (public.is_room_member(auth.uid(), room_id));
CREATE POLICY "Users can add themselves" ON public.members FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own member" ON public.members FOR UPDATE
  USING (auth.uid() = user_id);

-- Event policies
CREATE POLICY "Members can view room events" ON public.events FOR SELECT
  USING (public.is_room_member(auth.uid(), (SELECT room_id FROM public.members WHERE id = member_id)));
CREATE POLICY "Members can insert events for themselves" ON public.events FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.members WHERE id = member_id AND user_id = auth.uid())
  );
CREATE POLICY "Members can delete own events" ON public.events FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.members WHERE id = member_id AND user_id = auth.uid())
  );

-- Enable realtime for events
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;

-- Function to look up room by invite code (public, no auth needed for lookup)
CREATE OR REPLACE FUNCTION public.get_room_by_code(_code TEXT)
RETURNS TABLE(id UUID, name TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name FROM public.rooms WHERE invite_code = _code;
$$;
