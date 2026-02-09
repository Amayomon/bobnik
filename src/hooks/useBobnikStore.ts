import { useState, useCallback, useRef, useEffect } from 'react';

export interface Member {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export interface BobnikEvent {
  id: string;
  memberId: string;
  createdAt: Date;
}

const MOCK_MEMBERS: Member[] = [
  { id: '1', name: 'Tomáš', emoji: '🧢', color: 'hsl(28, 70%, 48%)' },
  { id: '2', name: 'Pepa', emoji: '🍔', color: 'hsl(35, 65%, 50%)' },
  { id: '3', name: 'Kuba', emoji: '🦊', color: 'hsl(20, 70%, 50%)' },
  { id: '4', name: 'Lucka', emoji: '🌸', color: 'hsl(340, 60%, 60%)' },
];

function generateMockEvents(): BobnikEvent[] {
  const events: BobnikEvent[] = [];
  const now = new Date();
  
  MOCK_MEMBERS.forEach(member => {
    // Generate events for past 30 days
    for (let daysAgo = 0; daysAgo < 30; daysAgo++) {
      const count = Math.floor(Math.random() * 4); // 0-3 events per day
      for (let i = 0; i < count; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - daysAgo);
        date.setHours(6 + Math.floor(Math.random() * 16), Math.floor(Math.random() * 60));
        events.push({
          id: `${member.id}-${daysAgo}-${i}`,
          memberId: member.id,
          createdAt: date,
        });
      }
    }
  });

  return events;
}

function getStartOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function useBobnikStore() {
  const [members] = useState<Member[]>(MOCK_MEMBERS);
  const [events, setEvents] = useState<BobnikEvent[]>(() => generateMockEvents());
  const [undoEvent, setUndoEvent] = useState<BobnikEvent | null>(null);
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);

  const addEvent = useCallback((memberId: string) => {
    const newEvent: BobnikEvent = {
      id: `${Date.now()}-${Math.random()}`,
      memberId,
      createdAt: new Date(),
    };
    setEvents(prev => [...prev, newEvent]);
    
    // Clear previous undo timer
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setUndoEvent(newEvent);
    undoTimerRef.current = setTimeout(() => setUndoEvent(null), 15000);
    
    return newEvent;
  }, []);

  const undoLastEvent = useCallback(() => {
    if (!undoEvent) return;
    setEvents(prev => prev.filter(e => e.id !== undoEvent.id));
    setUndoEvent(null);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
  }, [undoEvent]);

  const dismissUndo = useCallback(() => {
    setUndoEvent(null);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
  }, []);

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);

  const getTodayCount = useCallback((memberId: string) => {
    const today = getStartOfDay(new Date());
    return events.filter(e => e.memberId === memberId && e.createdAt >= today).length;
  }, [events]);

  const getDayCount = useCallback((memberId: string, date: Date) => {
    const start = getStartOfDay(date);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return events.filter(e => e.memberId === memberId && e.createdAt >= start && e.createdAt < end).length;
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
      .filter(e => e.memberId === memberId && e.createdAt >= start && e.createdAt < end)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }, [events]);

  const getCountInRange = useCallback((memberId: string, days: number) => {
    const start = new Date();
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);
    return events.filter(e => e.memberId === memberId && e.createdAt >= start).length;
  }, [events]);

  const getAllTimeCount = useCallback((memberId: string) => {
    return events.filter(e => e.memberId === memberId).length;
  }, [events]);

  const getStreak = useCallback((memberId: string) => {
    let streak = 0;
    const today = getStartOfDay(new Date());
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      if (getDayCount(memberId, d) > 0) {
        streak++;
      } else {
        break;
      }
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
        ? events.filter(e => e.memberId === memberId && e.createdAt >= start && e.createdAt < end).length
        : events.filter(e => e.createdAt >= start && e.createdAt < end).length;
      data.push({ date: start, count });
    }
    return data;
  }, [events]);

  return {
    members,
    events,
    addEvent,
    undoEvent,
    undoLastEvent,
    dismissUndo,
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
