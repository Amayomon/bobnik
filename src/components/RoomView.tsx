import { useState } from 'react';
import { useRoomStore } from '@/hooks/useRoomStore';
import { useAuth } from '@/hooks/useAuth';
import { MemberRow } from '@/components/MemberRow';
import { StatsBar } from '@/components/StatsBar';
import { UndoToast } from '@/components/UndoToast';
import { MemberDetail } from '@/components/MemberDetail';
import { StatsScreen } from '@/components/StatsScreen';
import { RoomActivityLog } from '@/components/RoomActivityLog';

interface RoomViewProps {
  roomId: string;
  onLeave: () => void;
}

export function RoomView({ roomId, onLeave }: RoomViewProps) {
  const store = useRoomStore(roomId);
  const { signOut } = useAuth();
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [copied, setCopied] = useState(false);

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

  // Map members for StatsBar (needs id field as string)
  const membersForStats = store.members.map(m => ({
    id: m.id,
    name: m.name,
    emoji: m.emoji,
    color: m.color,
  }));

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-md flex flex-col min-h-screen">
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
              <button
                onClick={() => setShowStats(true)}
                className="text-primary-foreground/80 hover:text-primary-foreground text-lg transition-colors"
              >
                📊
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
                  onLongPress={() => store.addEvent(member.id)}
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

        {/* Bottom nav */}
        <div className="px-4 pb-4 flex justify-between items-center">
          <button onClick={onLeave} className="text-xs text-muted-foreground">← Místnosti</button>
          <button onClick={signOut} className="text-xs text-muted-foreground">Odhlásit</button>
        </div>

        {/* Undo toast */}
        {store.undoEvent && (
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
            }))}
            allEvents={store.events
              .filter(e => e.member_id === selectedMember.id)
              .map(e => ({
                id: e.id,
                memberId: e.member_id,
                createdAt: new Date(e.created_at),
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

        {/* Stats screen */}
        {showStats && (
          <StatsScreen
            members={membersForStats}
            getCountInRange={store.getCountInRange}
            getAllTimeCount={store.getAllTimeCount}
            getStreak={store.getStreak}
            getHeatmapData={store.getHeatmapData}
            onClose={() => setShowStats(false)}
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
