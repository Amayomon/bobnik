import { useState, useCallback, useEffect } from 'react';
import { useRoomStore } from '@/hooks/useRoomStore';
import { useAuth } from '@/hooks/useAuth';
import { MemberRow } from '@/components/MemberRow';
import { StatsBar } from '@/components/StatsBar';
import { UndoToast } from '@/components/UndoToast';
import { MemberDetail } from '@/components/MemberDetail';
import { StatsScreen } from '@/components/StatsScreen';
import { ProfileScreen } from '@/components/ProfileScreen';
import { RoomActivityLog } from '@/components/RoomActivityLog';
import { EventRatingPopup } from '@/components/EventRatingPopup';
import { SpecialEventOverlay, determineSpecialType } from '@/components/SpecialEventOverlay';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { RecentActivityPanel } from '@/components/RecentActivityPanel';
import { FloatingAddButton } from '@/components/FloatingAddButton';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface RoomViewProps {
  roomId: string;
  onLeave: () => void;
}

type Screen = 'room' | 'stats' | 'profile' | 'log';

export function RoomView({ roomId, onLeave }: RoomViewProps) {
  const store = useRoomStore(roomId);
  const { signOut, user } = useAuth();
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [copied, setCopied] = useState(false);
  const [ratingEventId, setRatingEventId] = useState<string | null>(null);
  const [ratingMemberId, setRatingMemberId] = useState<string | null>(null);
  const [activeScreen, setActiveScreen] = useState<Screen>('room');
  const [specialOverlay, setSpecialOverlay] = useState<'angelic' | 'demonic' | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  // Edit mode: when editing an existing event from timeline
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  // Soft-delete undo state
  const [deletedEvent, setDeletedEvent] = useState<{ id: string; timeout: NodeJS.Timeout } | null>(null);

  // Clear expired auras on load
  useEffect(() => {
    if (!store.loading) store.clearExpiredAuras();
  }, [store.loading, store.clearExpiredAuras]);

  const handleAddEvent = useCallback(async (memberId: string) => {
    const eventId = await store.addEvent(memberId);
    if (eventId) {
      setRatingEventId(eventId);
      setRatingMemberId(memberId);
    }
  }, [store]);

  // Handle clicking a timeline event to edit it
  const handleEditEvent = useCallback((eventId: string) => {
    setEditingEventId(eventId);
  }, []);

  // Get edit values for the editing event
  const editingEvent = editingEventId ? store.events.find(e => e.id === editingEventId) : null;
  const editValues = editingEvent ? {
    consistency: editingEvent.consistency,
    smell: editingEvent.smell,
    size: editingEvent.size,
    effort: editingEvent.effort,
    notary_present: editingEvent.notary_present,
    neptunes_touch: editingEvent.neptunes_touch,
    phantom_cone: editingEvent.phantom_cone,
  } : null;

  // Check if current user can delete the editing event (own event OR room owner)
  const isRoomOwner = !!user && store.roomCreatedBy === user.id;
  const canDeleteEditingEvent = editingEvent ? (() => {
    const eventMember = store.members.find(m => m.id === editingEvent.member_id);
    return eventMember?.user_id === user?.id || isRoomOwner;
  })() : false;

  // Soft delete handler — uses SECURITY DEFINER RPC to bypass RLS UPDATE restriction
  const handleSoftDelete = useCallback(async (eventId: string) => {
    if (!user || !roomId) return;

    console.log('[handleSoftDelete] eventId:', eventId, 'user.id:', user.id);

    // Optimistic: remove from local state immediately
    store.removeEventLocally(eventId);
    setEditingEventId(null);

    const { error } = await supabase.rpc('soft_delete_event', {
      _event_id: eventId,
      _room_id: roomId,
    });

    if (error) {
      console.error('[handleSoftDelete] RPC error:', JSON.stringify(error));
      // Revert: reload events from DB
      store.reloadEvents();
      toast.error('Nepodařilo se odebrat záznam');
      return;
    }

    console.log('[handleSoftDelete] success for event:', eventId);

    // Show undo toast
    const timeout = setTimeout(() => {
      setDeletedEvent(null);
    }, 8000);

    if (deletedEvent?.timeout) clearTimeout(deletedEvent.timeout);
    setDeletedEvent({ id: eventId, timeout });

    toast('Záznam odebrán', {
      duration: 8000,
      action: {
        label: 'VRÁTIT',
        onClick: async () => {
          const { error: restoreError } = await supabase.rpc('restore_deleted_event', {
            _event_id: eventId,
            _room_id: roomId,
          });
          if (restoreError) {
            console.error('[restore] RPC error:', JSON.stringify(restoreError));
            toast.error('Nepodařilo se obnovit záznam');
          } else {
            store.reloadEvents();
          }
          clearTimeout(timeout);
          setDeletedEvent(null);
        },
      },
    });
  }, [user, roomId, deletedEvent]);

  const handleMenuNavigate = useCallback((target: 'room' | 'log' | 'stats' | 'profile' | 'invite' | 'settings' | 'lobby' | 'logout') => {
    if (target === 'invite') {
      setActiveScreen('room');
      setShowInvite(true);
    } else if (target === 'settings') {
      toast('Nastavení brzy přijde', { duration: 2000 });
    } else if (target === 'lobby') {
      onLeave();
    } else if (target === 'logout') {
      signOut();
    } else {
      setActiveScreen(target);
      setShowInvite(false);
    }
  }, [onLeave, signOut]);

  const last7Days = store.getLast7Days();
  const selectedMember = store.members.find(m => m.id === selectedMemberId);

  const copyInviteCode = () => {
    navigator.clipboard.writeText(store.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // If room failed to load (no access or doesn't exist), go back to lobby
  useEffect(() => {
    if (!store.loading && !store.roomName && !store.members.length) {
      onLeave();
    }
  }, [store.loading, store.roomName, store.members.length, onLeave]);

  if (store.loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="text-3xl animate-bounce">💩</span>
      </div>
    );
  }

  const membersForStats = store.members.map(m => ({
    id: m.id,
    name: m.name,
    emoji: m.emoji,
    color: m.color,
  }));

  return (
    <div className="h-[100dvh] bg-background flex justify-center overflow-hidden">
      <div className="w-full max-w-md flex flex-col h-full">

        {/* Minimal Header – elevated */}
        <div className="header-gradient px-5 py-4 rounded-b-2xl shadow-[0_4px_12px_hsl(var(--foreground)/0.10)]">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-extrabold text-primary-foreground tracking-tight">
                💩 {store.roomName || 'Bobník Tracker'}
              </h1>
              <p className="text-[11px] text-primary-foreground/60 font-normal mt-0.5">
                Kdo dnes kolikrát vysadil šišku?
              </p>
            </div>
            <button
              onClick={() => setMenuOpen(true)}
              className="bg-primary-foreground/15 hover:bg-primary-foreground/25 text-primary-foreground text-xl transition-colors p-2 rounded-lg shadow-[0_2px_6px_hsl(var(--foreground)/0.10)]"
              title="Menu"
            >
              ☰
            </button>
          </div>

          {/* Invite code (shown when triggered from menu) */}
          {showInvite && activeScreen === 'room' && (
            <div className="mt-3 bg-primary-foreground/10 rounded-lg px-3 py-2 flex items-center justify-between">
              <div>
                <p className="text-xs text-primary-foreground/70">Kód pro pozvání:</p>
                <p className="text-lg font-mono font-bold text-primary-foreground tracking-widest">{store.inviteCode}</p>
              </div>
              <button
                onClick={copyInviteCode}
                className="text-xs bg-primary-foreground/20 px-3 py-1.5 rounded-lg text-primary-foreground font-semibold"
              >
                {copied ? '✓ Zkopírováno' : 'Kopírovat'}
              </button>
            </div>
          )}
        </div>

        {/* Room screen content */}
        {activeScreen === 'room' && (
          <>
            {/* Non-scrolling stats row */}
            <div className="px-4 pt-3 pb-1 shrink-0">
              <StatsBar
                members={membersForStats}
                events={store.events}
                getCalendarWeekCount={store.getCalendarWeekCount}
                getAllTimeCount={store.getAllTimeCount}
                getStreak={store.getStreak}
              />
            </div>

            {/* Scrollable member list area */}
            <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-2">
              {/* Compact subtitle */}
              <p className="text-[11px] text-muted-foreground/70 text-center py-1">
                Dnes · {store.members.reduce((sum, m) => sum + store.getTodayCount(m.id), 0)} bobníků
              </p>

              {/* Member list – sorted by daily count desc, then name asc */}
              <div className="space-y-px">
                {[...store.members]
                  .sort((a, b) => {
                    const countDiff = store.getTodayCount(b.id) - store.getTodayCount(a.id);
                    if (countDiff !== 0) return countDiff;
                    return a.name.localeCompare(b.name);
                  })
                  .map(member => {
                  const todayCount = store.getTodayCount(member.id);
                  const weekDots = last7Days.map(d => store.getDayCount(member.id, d) > 0);

                  return (
                    <MemberRow
                      key={member.id}
                      member={{
                        id: member.id,
                        name: member.name,
                        emoji: member.emoji,
                        color: member.color,
                        aura_type: member.aura_type && member.aura_expires_at && new Date(member.aura_expires_at) > new Date() ? member.aura_type : null,
                      }}
                      todayCount={todayCount}
                      weekDots={weekDots}
                      onTap={() => setSelectedMemberId(member.id)}
                    />
                  );
                })}
              </div>
            </div>

            {/* Bottom bar – in layout flow, not overlay */}
            <div className="shrink-0 relative">
              {/* FAB positioned above the activity panel */}
              <FloatingAddButton
                myMemberId={store.myMember?.id ?? null}
                onAddEvent={handleAddEvent}
              />

              {/* Activity panel */}
              <RecentActivityPanel
                events={store.events}
                members={store.members.map(m => ({ id: m.id, name: m.name, emoji: m.emoji }))}
                onOpenLog={() => setActiveScreen('log')}
              />
            </div>
          </>
        )}

        {/* Stats screen */}
        {activeScreen === 'stats' && (
          <StatsScreen
            members={membersForStats}
            events={store.events}
            getCountInRange={store.getCountInRange}
            getAllTimeCount={store.getAllTimeCount}
            getStreak={store.getStreak}
            getHeatmapData={store.getHeatmapData}
            onClose={() => setActiveScreen('room')}
          />
        )}

        {/* Profile screen */}
        {activeScreen === 'profile' && store.myMember && (
          <ProfileScreen
            member={{ id: store.myMember.id, name: store.myMember.name, emoji: store.myMember.emoji, color: store.myMember.color }}
            events={store.events}
            streak={store.getStreak(store.myMember.id)}
            onClose={() => setActiveScreen('room')}
            onProfileUpdated={() => {}}
          />
        )}

        {/* Activity log screen */}
        {activeScreen === 'log' && (
          <RoomActivityLog
            events={store.events}
            members={store.members.map(m => ({ id: m.id, name: m.name, emoji: m.emoji }))}
            onClose={() => setActiveScreen('room')}
          />
        )}

        {/* Hamburger menu */}
        <HamburgerMenu
          open={menuOpen}
          onOpenChange={setMenuOpen}
          onNavigate={handleMenuNavigate}
        />

        {/* Rating popup — new event or editing existing */}
        <EventRatingPopup
          open={!!ratingEventId || !!editingEventId}
          editValues={editValues}
          onSave={async (ratings) => {
            const targetId = editingEventId || ratingEventId;
            if (targetId) {
              const special = determineSpecialType(ratings);
              const updateData = {
                ...ratings,
                special_type: special,
              };
              await store.updateEventRatings(targetId, updateData);

              if (special && ratingMemberId) {
                await store.setMemberAura(ratingMemberId, special);
                setSpecialOverlay(special);
              }

              toast('Uloženo ✓', { duration: 2000 });
            }
            setRatingEventId(null);
            setRatingMemberId(null);
            setEditingEventId(null);
          }}
          onSkip={() => { setRatingEventId(null); setRatingMemberId(null); setEditingEventId(null); }}
          onUndo={() => {
            setRatingEventId(null);
            setRatingMemberId(null);
            store.undoLastEvent();
          }}
          canUndo={!!ratingEventId && !editingEventId}
          onDelete={canDeleteEditingEvent && editingEventId ? () => handleSoftDelete(editingEventId) : undefined}
        />

        {/* Undo toast */}
        {store.undoEvent && !ratingEventId && (
          <UndoToast
            event={{ id: store.undoEvent.id, memberId: store.undoEvent.member_id, createdAt: new Date(store.undoEvent.created_at) }}
            member={(() => {
              const m = store.members.find(m => m.id === store.undoEvent!.member_id);
              return m ? { id: m.id, name: m.name, emoji: m.emoji, color: m.color } : undefined;
            })()}
            onUndo={store.undoLastEvent}
            onDismiss={store.dismissUndo}
          />
        )}

        {/* Member detail */}
        {selectedMember && (
          <MemberDetail
            member={{ id: selectedMember.id, name: selectedMember.name, emoji: selectedMember.emoji, color: selectedMember.color }}
            todayEvents={store.getEventsForDay(selectedMember.id, new Date()).map(e => ({
              id: e.id,
              memberId: e.member_id,
              createdAt: new Date(e.created_at),
              consistency: e.consistency,
              smell: e.smell,
              size: e.size,
              effort: e.effort,
              notaryPresent: e.notary_present,
              specialType: e.special_type,
            }))}
            allEvents={store.events
              .filter(e => e.member_id === selectedMember.id)
              .map(e => ({
                id: e.id,
                memberId: e.member_id,
                createdAt: new Date(e.created_at),
                consistency: e.consistency,
                smell: e.smell,
                size: e.size,
                effort: e.effort,
                notaryPresent: e.notary_present,
                specialType: e.special_type,
              }))}
            weekCounts={last7Days.map(d => ({
              date: d,
              count: store.getDayCount(selectedMember.id, d),
            }))}
            streak={store.getStreak(selectedMember.id)}
            avg7={(store.getCountInRange(selectedMember.id, 7) / 7).toFixed(1)}
            avg30={(store.getCountInRange(selectedMember.id, 30) / 30).toFixed(1)}
            onClose={() => setSelectedMemberId(null)}
            onEditEvent={handleEditEvent}
          />
        )}

        {/* Special event overlay */}
        {specialOverlay && (
          <SpecialEventOverlay
            type={specialOverlay}
            onDone={() => setSpecialOverlay(null)}
          />
        )}
      </div>
    </div>
  );
}
