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
  aura_type: string | null;
  aura_expires_at: string | null;
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
  special_type: string | null;
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
  const [roomCreatedBy, setRoomCreatedBy] = useState<string | null>(null); // room owner
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
        supabase.from('rooms').select('name, invite_code, created_by').eq('id', roomId).maybeSingle(),
        supabase.from('members').select('*').eq('room_id', roomId),
        supabase.from('events').select('*').eq('room_id', roomId).order('created_at', { ascending: true }),
      ]);

      if (roomRes.data) {
        setRoomName(roomRes.data.name);
        setInviteCode(roomRes.data.invite_code);
        setRoomCreatedBy(roomRes.data.created_by);
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
            const newEvent = payload.new as BobnikEvent;
            setEvents(prev => {
              // Skip if already present (optimistic or duplicate)
              if (prev.some(e => e.id === newEvent.id)) return prev;
              return [...prev, newEvent];
            });
          } else if (payload.eventType === 'DELETE') {
            setEvents(prev => prev.filter(e => e.id !== (payload.old as any).id));
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as BobnikEvent & { is_deleted?: boolean };
            if (updated.is_deleted) {
              // Soft-deleted — remove from local state immediately
              setEvents(prev => prev.filter(e => e.id !== updated.id));
            } else {
              setEvents(prev => prev.map(e => e.id === updated.id ? updated : e));
            }
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId]);

  const myMember = members.find(m => m.user_id === user?.id);

  const addEvent = useCallback(async (memberId: string): Promise<string | null> => {
    if (!roomId) return null;

    // Optimistic event
    const optimisticId = crypto.randomUUID();
    const optimisticEvent: BobnikEvent = {
      id: optimisticId,
      room_id: roomId,
      member_id: memberId,
      created_at: new Date().toISOString(),
      consistency: 0, smell: 0, size: 0, effort: 0,
      notary_present: false,
      special_type: null,
    };
    setEvents(prev => [...prev, optimisticEvent]);

    const { data, error } = await supabase
      .from('events')
      .insert({ room_id: roomId, member_id: memberId })
      .select()
      .single();

    if (data && !error) {
      // Replace optimistic with real
      setEvents(prev => prev.map(e => e.id === optimisticId ? (data as BobnikEvent) : e));
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      setUndoEvent(data as BobnikEvent);
      undoTimerRef.current = setTimeout(() => setUndoEvent(null), 15000);
      return data.id;
    } else {
      // Revert optimistic
      setEvents(prev => prev.filter(e => e.id !== optimisticId));
      return null;
    }
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

  const updateEventRatings = useCallback(async (eventId: string, ratings: { consistency: number; smell: number; size: number; effort: number; notary_present?: boolean; special_type?: string | null }) => {
    await supabase.from('events').update(ratings).eq('id', eventId);
  }, []);

  // Optimistically remove a single event from local state (used after soft-delete)
  const removeEventLocally = useCallback((eventId: string) => {
    setEvents(prev => prev.filter(e => e.id !== eventId));
  }, []);

  // Re-fetch events from DB (used to revert optimistic update on error)
  const reloadEvents = useCallback(async () => {
    if (!roomId) return;
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });
    if (data) setEvents(data as BobnikEvent[]);
  }, [roomId]);

  const setMemberAura = useCallback(async (memberId: string, auraType: string) => {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('members').update({ aura_type: auraType, aura_expires_at: expiresAt }).eq('id', memberId);
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, aura_type: auraType, aura_expires_at: expiresAt } : m));
  }, []);

  const clearExpiredAuras = useCallback(() => {
    const now = new Date();
    setMembers(prev => prev.map(m => {
      if (m.aura_type && m.aura_expires_at && new Date(m.aura_expires_at) <= now) {
        return { ...m, aura_type: null, aura_expires_at: null };
      }
      return m;
    }));
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

  // ISO calendar week (Mon 00:00 – Sun 23:59:59) in user's timezone
  const getCalendarWeekCount = useCallback((memberId: string) => {
    const now = new Date();
    const day = now.getDay(); // 0=Sun,1=Mon...6=Sat
    const diffToMonday = day === 0 ? 6 : day - 1;
    const monday = new Date(now);
    monday.setDate(monday.getDate() - diffToMonday);
    monday.setHours(0, 0, 0, 0);
    return events.filter(e => e.member_id === memberId && new Date(e.created_at) >= monday).length;
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
    roomCreatedBy,
    inviteCode,
    loading,
    myMember,
    addEvent,
    undoEvent,
    undoLastEvent,
    dismissUndo,
    updateEventRatings,
    removeEventLocally,
    reloadEvents,
    setMemberAura,
    clearExpiredAuras,
    getTodayCount,
    getDayCount,
    getLast7Days,
    getEventsForDay,
    getCountInRange,
    getCalendarWeekCount,
    getAllTimeCount,
    getStreak,
    getHeatmapData,
  };
}
