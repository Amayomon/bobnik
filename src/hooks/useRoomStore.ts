import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Member {
  id: string;
  room_id: string;
  user_id: string;
  name: string;
  emoji: string;
  color: string;
}

interface BobnikEvent {
  id: string;
  room_id: string;
  member_id: string;
  created_at: string;
  consistency: number;
  smell: number;
  size: number;
  effort: number;
  notary_present: boolean;
}

function getStartOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function useRoomStore(roomId: string | null) {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [events, setEvents] = useState<BobnikEvent[]>([]);
  const [roomName, setRoomName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [undoEvent, setUndoEvent] = useState<BobnikEvent | null>(null);
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load room data
  useEffect(() => {
    if (!roomId) return;

    const loadData = async () => {
      setLoading(true);

      const [roomRes, membersRes, eventsRes] = await Promise.all([
        supabase.from('rooms').select('name, invite_code').eq('id', roomId).maybeSingle(),
        supabase.from('members').select('*').eq('room_id', roomId),
        supabase.from('events').select('*').eq('room_id', roomId).order('created_at', { ascending: true }),
      ]);

      if (roomRes.data) {
        setRoomName(roomRes.data.name);
        setInviteCode(roomRes.data.invite_code);
      }
      if (membersRes.data) setMembers(membersRes.data as Member[]);
      if (eventsRes.data) setEvents(eventsRes.data as BobnikEvent[]);
      setLoading(false);
    };

    loadData();

    // Realtime subscription for events
    const channel = supabase
      .channel(`room-events-${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events', filter: `room_id=eq.${roomId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setEvents(prev => [...prev, payload.new as BobnikEvent]);
          } else if (payload.eventType === 'DELETE') {
            setEvents(prev => prev.filter(e => e.id !== (payload.old as any).id));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId]);

  const myMember = members.find(m => m.user_id === user?.id);

  const addEvent = useCallback(async (memberId: string): Promise<string | null> => {
    if (!roomId) return null;
    const { data, error } = await supabase
      .from('events')
      .insert({ room_id: roomId, member_id: memberId })
      .select()
      .single();

    if (data && !error) {
      // Set undo
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      setUndoEvent(data as BobnikEvent);
      undoTimerRef.current = setTimeout(() => setUndoEvent(null), 15000);
      return data.id;
    }
    return null;
  }, [roomId]);

  const undoLastEvent = useCallback(async () => {
    if (!undoEvent) return;
    await supabase.from('events').delete().eq('id', undoEvent.id);
    setUndoEvent(null);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
  }, [undoEvent]);

  const dismissUndo = useCallback(() => {
    setUndoEvent(null);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
  }, []);

  const updateEventRatings = useCallback(async (eventId: string, ratings: { consistency: number; smell: number; size: number; effort: number; notary_present?: boolean }) => {
    await supabase.from('events').update(ratings).eq('id', eventId);
  }, []);

  const getTodayCount = useCallback((memberId: string) => {
    const today = getStartOfDay(new Date());
    return events.filter(e => e.member_id === memberId && new Date(e.created_at) >= today).length;
  }, [events]);

  const getDayCount = useCallback((memberId: string, date: Date) => {
    const start = getStartOfDay(date);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return events.filter(e => e.member_id === memberId && new Date(e.created_at) >= start && new Date(e.created_at) < end).length;
  }, [events]);

  const getLast7Days = useCallback(() => {
    const days: Date[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(getStartOfDay(d));
    }
    return days;
  }, []);

  const getEventsForDay = useCallback((memberId: string, date: Date) => {
    const start = getStartOfDay(date);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return events
      .filter(e => e.member_id === memberId && new Date(e.created_at) >= start && new Date(e.created_at) < end)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [events]);

  const getCountInRange = useCallback((memberId: string, days: number) => {
    const start = new Date();
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);
    return events.filter(e => e.member_id === memberId && new Date(e.created_at) >= start).length;
  }, [events]);

  const getAllTimeCount = useCallback((memberId: string) => {
    return events.filter(e => e.member_id === memberId).length;
  }, [events]);

  const getStreak = useCallback((memberId: string) => {
    let streak = 0;
    const today = getStartOfDay(new Date());
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      if (getDayCount(memberId, d) > 0) streak++;
      else break;
    }
    return streak;
  }, [getDayCount]);

  const getHeatmapData = useCallback((memberId: string | null, days: number = 90) => {
    const data: { date: Date; count: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const start = getStartOfDay(d);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      const count = memberId
        ? events.filter(e => e.member_id === memberId && new Date(e.created_at) >= start && new Date(e.created_at) < end).length
        : events.filter(e => new Date(e.created_at) >= start && new Date(e.created_at) < end).length;
      data.push({ date: start, count });
    }
    return data;
  }, [events]);

  return {
    members,
    events,
    roomName,
    inviteCode,
    loading,
    myMember,
    addEvent,
    undoEvent,
    undoLastEvent,
    dismissUndo,
    updateEventRatings,
    getTodayCount,
    getDayCount,
    getLast7Days,
    getEventsForDay,
    getCountInRange,
    getAllTimeCount,
    getStreak,
    getHeatmapData,
  };
}
