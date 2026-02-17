import { useState, useRef, useCallback, useEffect } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { cs } from 'date-fns/locale';

interface EventWithRatings {
  id: string;
  memberId: string;
  createdAt: Date;
  consistency?: number;
  smell?: number;
  size?: number;
  effort?: number;
  notaryPresent?: boolean;
  specialType?: string | null;
}

interface MemberDetailProps {
  member: { id: string; name: string; emoji: string; color: string };
  todayEvents: EventWithRatings[];
  allEvents: EventWithRatings[];
  weekCounts: { date: Date; count: number }[];
  streak: number;
  avg7: string;
  avg30: string;
  canDelete: boolean;
  onClose: () => void;
  onDeleteEvent: (eventId: string) => Promise<void>;
  onUndoDelete: (eventId: string, event: EventWithRatings) => Promise<void>;
}

function groupEventsByDay(events: EventWithRatings[]) {
  const groups: { key: string; label: string; events: EventWithRatings[] }[] = [];
  const sorted = [...events].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  for (const ev of sorted) {
    const dayKey = format(ev.createdAt, 'yyyy-MM-dd');
    let group = groups.find(g => g.key === dayKey);
    if (!group) {
      let label: string;
      if (isToday(ev.createdAt)) label = 'Dnes';
      else if (isYesterday(ev.createdAt)) label = 'Včera';
      else label = format(ev.createdAt, 'd. MMMM yyyy', { locale: cs });
      group = { key: dayKey, label, events: [] };
      groups.push(group);
    }
    group.events.push(ev);
  }
  return groups;
}

const RATING_LABELS = [
  { key: 'consistency' as const, abbr: 'K' },
  { key: 'smell' as const, abbr: 'Z' },
  { key: 'size' as const, abbr: 'V' },
  { key: 'effort' as const, abbr: 'Ú' },
];

// --- Swipeable Row ---
function SwipeableRow({
  children,
  canDelete,
  onDelete,
}: {
  children: React.ReactNode;
  canDelete: boolean;
  onDelete: () => void;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const swipingRef = useRef(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (!canDelete) return;
    startXRef.current = e.touches[0].clientX;
    currentXRef.current = 0;
    swipingRef.current = false;
  }, [canDelete]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!canDelete) return;
    const dx = e.touches[0].clientX - startXRef.current;
    if (dx < -10) swipingRef.current = true;
    if (!swipingRef.current) return;
    currentXRef.current = Math.min(0, Math.max(dx, -90));
    if (rowRef.current) {
      rowRef.current.style.transform = `translateX(${currentXRef.current}px)`;
    }
  }, [canDelete]);

  const onTouchEnd = useCallback(() => {
    if (!canDelete || !rowRef.current) return;
    if (currentXRef.current < -50) {
      rowRef.current.style.transform = 'translateX(-80px)';
    } else {
      rowRef.current.style.transform = 'translateX(0)';
    }
    swipingRef.current = false;
  }, [canDelete]);

  const resetSwipe = useCallback(() => {
    if (rowRef.current) rowRef.current.style.transform = 'translateX(0)';
  }, []);

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Delete action behind */}
      {canDelete && (
        <div className="absolute inset-y-0 right-0 w-20 flex items-center justify-center bg-destructive">
          <button
            onClick={() => { resetSwipe(); onDelete(); }}
            className="text-destructive-foreground text-xs font-semibold w-full h-full"
          >
            Odebrat
          </button>
        </div>
      )}
      {/* Foreground row */}
      <div
        ref={rowRef}
        className="relative bg-muted/50 transition-transform duration-150"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}

// --- Inline Detail Panel ---
function DetailPanel({ event, onDelete, canDelete }: { event: EventWithRatings; onDelete: () => void; canDelete: boolean }) {
  const hasRatings = RATING_LABELS.some(r => (event[r.key] ?? 0) !== 0);

  return (
    <div className="mx-1 mb-1 p-3 bg-card rounded-xl shadow-md border border-border/50 animate-pop-in">
      <p className="text-[11px] font-semibold text-muted-foreground mb-2">Detail záznamu</p>
      <div className="flex flex-wrap gap-2 text-xs text-foreground mb-3">
        <span className="bg-muted rounded-md px-2 py-1">+1 záznam</span>
        <span className="bg-muted rounded-md px-2 py-1">{format(event.createdAt, 'HH:mm')}</span>
        <span className="bg-muted rounded-md px-2 py-1">{format(event.createdAt, 'd. MMMM yyyy', { locale: cs })}</span>
        {event.specialType === 'angelic' && <span className="bg-muted rounded-md px-2 py-1">✨ Andělská</span>}
        {event.specialType === 'demonic' && <span className="bg-muted rounded-md px-2 py-1">🔥 Ďábelská</span>}
        {event.notaryPresent && <span className="bg-muted rounded-md px-2 py-1">📜 Notář</span>}
        {hasRatings && RATING_LABELS.map(r => {
          const val = event[r.key] ?? 0;
          if (val === 0) return null;
          return <span key={r.key} className="bg-muted rounded-md px-2 py-1 tabular-nums">{r.abbr}: {val > 0 ? `+${val}` : val}</span>;
        })}
      </div>
      {canDelete && (
        <button
          onClick={onDelete}
          className="w-full py-2 rounded-lg bg-destructive/10 text-destructive text-sm font-semibold hover:bg-destructive/20 transition-colors"
        >
          Odebrat záznam
        </button>
      )}
    </div>
  );
}

// --- Delete Undo Toast ---
function DeleteUndoToast({ onUndo, onDismiss }: { onUndo: () => void; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(onDismiss, 8000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="flex items-center gap-3 px-4 py-2.5 bg-[hsl(var(--undo-bg))] text-[hsl(var(--undo-foreground))] rounded-full shadow-lg">
        <span className="text-sm">Záznam odebrán</span>
        <button onClick={onUndo} className="text-sm font-bold text-primary underline underline-offset-2">
          VRÁTIT
        </button>
        <div className="w-12 h-1 bg-muted/30 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full animate-progress-fill-8s" />
        </div>
      </div>
    </div>
  );
}

export function MemberDetail({
  member,
  todayEvents,
  allEvents,
  weekCounts,
  streak,
  avg7,
  avg30,
  canDelete: canDeleteProp,
  onClose,
  onDeleteEvent,
  onUndoDelete,
}: MemberDetailProps) {
  const maxWeekCount = Math.max(...weekCounts.map(d => d.count), 1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletedEvent, setDeletedEvent] = useState<EventWithRatings | null>(null);

  const handleDelete = useCallback(async (ev: EventWithRatings) => {
    setExpandedId(null);
    setDeletedEvent(ev);
    await onDeleteEvent(ev.id);
  }, [onDeleteEvent]);

  const handleUndo = useCallback(async () => {
    if (!deletedEvent) return;
    const ev = deletedEvent;
    setDeletedEvent(null);
    await onUndoDelete(ev.id, ev);
  }, [deletedEvent, onUndoDelete]);

  const handleDismissUndo = useCallback(() => {
    setDeletedEvent(null);
  }, []);

  // Close expanded panel on modal close
  const handleClose = useCallback(() => {
    setExpandedId(null);
    setDeletedEvent(null);
    onClose();
  }, [onClose]);

  // Show last 30 days of events grouped by day
  const recentEvents = allEvents.filter(e => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return e.createdAt >= cutoff;
  });
  const grouped = groupEventsByDay(recentEvents);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-foreground/20 backdrop-blur-sm" onClick={handleClose}>
      <div
        className="w-full max-w-md bg-card rounded-t-2xl p-5 pb-8 animate-slide-up shadow-xl max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-3xl">{member.emoji}</span>
            <h2 className="text-xl font-bold text-foreground">{member.name}</h2>
            <span className="text-xl">💩</span>
          </div>
          <button onClick={handleClose} className="text-muted-foreground text-xl p-1">✕</button>
        </div>

        {/* Timeline */}
        <div className="mb-5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Časová osa</h3>
          {grouped.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Zatím žádný bobník 🧐</p>
          ) : (
            <div className="space-y-3">
              {grouped.map(group => (
                <div key={group.key}>
                  <p className="text-[11px] font-semibold text-muted-foreground mb-1">{group.label}</p>
                  <div className="space-y-0.5">
                    {group.events.map(ev => {
                      const canDelete = canDeleteProp;
                      return (
                        <div key={ev.id}>
                          <SwipeableRow canDelete={canDelete} onDelete={() => handleDelete(ev)}>
                            <div className="flex items-center gap-2 px-2.5 py-1.5">
                              <span className="text-xs text-muted-foreground tabular-nums w-10">
                                {format(ev.createdAt, 'HH:mm')}
                              </span>
                              <span className="text-sm text-foreground flex-1">+1 záznam</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedId(expandedId === ev.id ? null : ev.id);
                                }}
                                className="text-muted-foreground hover:text-foreground transition-colors p-1 text-sm"
                              >
                                ⋯
                              </button>
                            </div>
                          </SwipeableRow>
                          {expandedId === ev.id && (
                            <DetailPanel event={ev} onDelete={() => handleDelete(ev)} canDelete={canDelete} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Week chart */}
        <div className="mb-5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Posledních 7 dní</h3>
          <div className="flex items-end gap-1.5 h-20">
            {weekCounts.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex justify-center">
                  <div
                    className="w-full max-w-[28px] bg-primary/80 rounded-t-md transition-all duration-300"
                    style={{ height: `${(day.count / maxWeekCount) * 56}px`, minHeight: day.count > 0 ? 4 : 0 }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {format(day.date, 'EEE', { locale: cs }).slice(0, 2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-muted/50 rounded-lg p-2.5 text-center">
            <div className="text-[10px] font-bold text-muted-foreground uppercase">Streak</div>
            <div className="text-lg font-bold text-foreground">🔥 {streak}</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-2.5 text-center">
            <div className="text-[10px] font-bold text-muted-foreground uppercase">Ø 7 dní</div>
            <div className="text-lg font-bold text-foreground">{avg7}</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-2.5 text-center">
            <div className="text-[10px] font-bold text-muted-foreground uppercase">Ø 30 dní</div>
            <div className="text-lg font-bold text-foreground">{avg30}</div>
          </div>
        </div>

        {/* Delete undo toast */}
        {deletedEvent && (
          <DeleteUndoToast onUndo={handleUndo} onDismiss={handleDismissUndo} />
        )}
      </div>
    </div>
  );
}
