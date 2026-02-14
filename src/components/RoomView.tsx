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

interface RoomViewProps {
  roomId: string;
  onLeave: () => void;
}

type Screen = 'room' | 'stats' | 'profile' | 'log';

export function RoomView({ roomId, onLeave }: RoomViewProps) {
  const store = useRoomStore(roomId);
  const { signOut } = useAuth();
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [copied, setCopied] = useState(false);
  const [ratingEventId, setRatingEventId] = useState<string | null>(null);
  const [ratingMemberId, setRatingMemberId] = useState<string | null>(null);
  const [activeScreen, setActiveScreen] = useState<Screen>('room');
  const [specialOverlay, setSpecialOverlay] = useState<'angelic' | 'demonic' | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

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

  const handleMenuNavigate = useCallback((target: 'room' | 'log' | 'stats' | 'profile' | 'invite' | 'settings') => {
    if (target === 'invite') {
      setActiveScreen('room');
      setShowInvite(true);
    } else if (target === 'settings') {
      // Settings placeholder — for now just show toast
      toast('Nastavení brzy přijde', { duration: 2000 });
    } else {
      setActiveScreen(target);
      setShowInvite(false);
    }
  }, []);

  const last7Days = store.getLast7Days();
  const selectedMember = store.members.find(m => m.id === selectedMemberId);

  const copyInviteCode = () => {
    navigator.clipboard.writeText(store.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-md flex flex-col min-h-screen">

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
            <div className="flex-1 px-4 py-3 space-y-2 pb-32">
              {/* Compact stats row */}
              <StatsBar
                members={membersForStats}
                getCountInRange={store.getCountInRange}
                getAllTimeCount={store.getAllTimeCount}
                getStreak={store.getStreak}
              />

              {/* Compact subtitle */}
              <p className="text-[11px] text-muted-foreground/70 text-center">
                Dnes · {store.members.reduce((sum, m) => sum + store.getTodayCount(m.id), 0)} bobníků
              </p>

              {/* Member list */}
              <div className="space-y-px">
                {store.members.map(member => {
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
                      onLongPress={() => handleAddEvent(member.id)}
                      onTap={() => setSelectedMemberId(member.id)}
                    />
                  );
                })}
              </div>

              {/* Footer links */}
              <div className="pt-2 flex justify-between items-center">
                <button onClick={onLeave} className="text-xs text-muted-foreground">← Místnosti</button>
                <button onClick={signOut} className="text-xs text-muted-foreground">Odhlásit</button>
              </div>
            </div>

            {/* Floating add button */}
            <FloatingAddButton
              myMemberId={store.myMember?.id ?? null}
              onAddEvent={handleAddEvent}
            />

            {/* Persistent activity panel */}
            <RecentActivityPanel
              events={store.events}
              members={store.members.map(m => ({ id: m.id, name: m.name, emoji: m.emoji }))}
              onOpenLog={() => setActiveScreen('log')}
            />
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

        {/* Rating popup */}
        <EventRatingPopup
          open={!!ratingEventId}
          onSave={async (ratings) => {
            if (ratingEventId) {
              const special = determineSpecialType(ratings);
              const updateData = { ...ratings, special_type: special };
              await store.updateEventRatings(ratingEventId, updateData);

              if (special && ratingMemberId) {
                await store.setMemberAura(ratingMemberId, special);
                setSpecialOverlay(special);
              }

              toast('Uloženo ✓', { duration: 2000 });
            }
            setRatingEventId(null);
            setRatingMemberId(null);
          }}
          onSkip={() => { setRatingEventId(null); setRatingMemberId(null); }}
          onUndo={() => {
            setRatingEventId(null);
            setRatingMemberId(null);
            store.undoLastEvent();
          }}
          canUndo={!!store.undoEvent}
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
