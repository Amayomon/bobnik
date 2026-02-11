import { useState, useCallback } from 'react';
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
import { toast } from 'sonner';

interface RoomViewProps {
  roomId: string;
  onLeave: () => void;
}

type Tab = 'room' | 'stats' | 'profile';

export function RoomView({ roomId, onLeave }: RoomViewProps) {
  const store = useRoomStore(roomId);
  const { signOut } = useAuth();
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [copied, setCopied] = useState(false);
  const [ratingEventId, setRatingEventId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('room');

  const handleAddEvent = useCallback(async (memberId: string) => {
    const eventId = await store.addEvent(memberId);
    if (eventId) {
      setRatingEventId(eventId);
    }
  }, [store]);

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

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'room', label: 'Místnost', icon: '🏠' },
    { key: 'stats', label: 'Statistiky', icon: '📊' },
    { key: 'profile', label: 'Profil', icon: '👤' },
  ];

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-md flex flex-col min-h-screen">

        {/* Room tab content */}
        {activeTab === 'room' && (
          <>
            {/* Header */}
            <div className="header-gradient px-5 py-4 rounded-b-2xl shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-3xl">💩</span>
                  <h1 className="text-xl font-extrabold text-primary-foreground tracking-tight">
                    {store.roomName || 'Bobník Tracker'}
                  </h1>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowInvite(!showInvite)}
                    className="text-primary-foreground/80 hover:text-primary-foreground text-lg transition-colors"
                    title="Pozvat"
                  >
                    🔗
                  </button>
                  <button
                    onClick={() => setShowActivity(true)}
                    className="text-primary-foreground/80 hover:text-primary-foreground text-lg transition-colors"
                    title="Aktivita"
                  >
                    📋
                  </button>
                </div>
              </div>
              {showInvite && (
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

            {/* Content */}
            <div className="flex-1 px-4 py-4 space-y-1">
              <div className="mb-3">
                <h2 className="text-lg font-bold text-foreground">Dnešní skóre</h2>
                <p className="text-sm text-muted-foreground">Kdo dnes kolikrát vysadil šišku?</p>
              </div>

              <div className="border-t border-border mb-2" />

              <div className="space-y-0.5">
                {store.members.map(member => {
                  const todayCount = store.getTodayCount(member.id);
                  const weekDots = last7Days.map(d => store.getDayCount(member.id, d) > 0);

                  return (
                    <MemberRow
                      key={member.id}
                      member={{ id: member.id, name: member.name, emoji: member.emoji, color: member.color }}
                      todayCount={todayCount}
                      weekDots={weekDots}
                      onLongPress={() => handleAddEvent(member.id)}
                      onTap={() => setSelectedMemberId(member.id)}
                    />
                  );
                })}
              </div>

              <p className="text-[11px] text-muted-foreground text-center mt-3 opacity-70">
                Dlouhým stiskem přidáš +1 bobník 💩
              </p>
            </div>

            {/* Stats bar */}
            <div className="px-4 pb-4">
              <StatsBar
                members={membersForStats}
                getCountInRange={store.getCountInRange}
                getAllTimeCount={store.getAllTimeCount}
                getStreak={store.getStreak}
              />
            </div>

            {/* Footer links */}
            <div className="px-4 pb-2 flex justify-between items-center">
              <button onClick={onLeave} className="text-xs text-muted-foreground">← Místnosti</button>
              <button onClick={signOut} className="text-xs text-muted-foreground">Odhlásit</button>
            </div>
          </>
        )}

        {/* Stats tab */}
        {activeTab === 'stats' && (
          <StatsScreen
            members={membersForStats}
            events={store.events}
            getCountInRange={store.getCountInRange}
            getAllTimeCount={store.getAllTimeCount}
            getStreak={store.getStreak}
            getHeatmapData={store.getHeatmapData}
            onClose={() => setActiveTab('room')}
          />
        )}

        {/* Profile tab */}
        {activeTab === 'profile' && store.myMember && (
          <ProfileScreen
            member={{ id: store.myMember.id, name: store.myMember.name, emoji: store.myMember.emoji, color: store.myMember.color }}
            events={store.events}
            streak={store.getStreak(store.myMember.id)}
            onClose={() => setActiveTab('room')}
            onProfileUpdated={() => {
              // Trigger a re-fetch by forcing re-render — members are already reactive via realtime
            }}
          />
        )}

        {/* Bottom navigation */}
        <div className="sticky bottom-0 bg-card border-t border-border px-2 py-1.5 flex justify-around">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg transition-colors ${
                activeTab === tab.key
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="text-[10px] font-semibold">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Rating popup */}
        <EventRatingPopup
          open={!!ratingEventId}
          onSave={async (ratings) => {
            if (ratingEventId) {
              await store.updateEventRatings(ratingEventId, ratings);
              toast('Uloženo ✓', { duration: 2000 });
            }
            setRatingEventId(null);
          }}
          onSkip={() => setRatingEventId(null)}
          onUndo={() => {
            setRatingEventId(null);
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

        {/* Activity log */}
        {showActivity && (
          <RoomActivityLog
            events={store.events}
            members={store.members.map(m => ({ id: m.id, name: m.name, emoji: m.emoji }))}
            onClose={() => setShowActivity(false)}
          />
        )}
      </div>
    </div>
  );
}
