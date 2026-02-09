import { useState } from 'react';
import { useBobnikStore } from '@/hooks/useBobnikStore';
import { MemberRow } from '@/components/MemberRow';
import { StatsBar } from '@/components/StatsBar';
import { UndoToast } from '@/components/UndoToast';
import { MemberDetail } from '@/components/MemberDetail';
import { StatsScreen } from '@/components/StatsScreen';

const Index = () => {
  const store = useBobnikStore();
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);

  const last7Days = store.getLast7Days();
  const selectedMember = store.members.find(m => m.id === selectedMemberId);

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-md flex flex-col min-h-screen">
        {/* Header */}
        <div className="header-gradient px-5 py-4 rounded-b-2xl shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-3xl">💩</span>
              <h1 className="text-xl font-extrabold text-primary-foreground tracking-tight">
                Bobník Tracker
              </h1>
            </div>
            <button
              onClick={() => setShowStats(true)}
              className="text-primary-foreground/80 hover:text-primary-foreground text-xl transition-colors"
            >
              ⚙️
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-4 py-4 space-y-1">
          {/* Section title */}
          <div className="mb-3">
            <h2 className="text-lg font-bold text-foreground">Dnešní skóre</h2>
            <p className="text-sm text-muted-foreground">
              Kdo dnes kolikrát vysadil šišku?
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-border mb-2" />

          {/* Member rows */}
          <div className="space-y-0.5">
            {store.members.map(member => {
              const todayCount = store.getTodayCount(member.id);
              const weekDots = last7Days.map(d => store.getDayCount(member.id, d) > 0);

              return (
                <MemberRow
                  key={member.id}
                  member={member}
                  todayCount={todayCount}
                  weekDots={weekDots}
                  onLongPress={() => store.addEvent(member.id)}
                  onTap={() => setSelectedMemberId(member.id)}
                />
              );
            })}
          </div>

          {/* Hint */}
          <p className="text-[11px] text-muted-foreground text-center mt-3 opacity-70">
            Dlouhým stiskem přidáš +1 bobník 💩
          </p>
        </div>

        {/* Stats bar */}
        <div className="px-4 pb-4">
          <StatsBar
            members={store.members}
            getCountInRange={store.getCountInRange}
            getAllTimeCount={store.getAllTimeCount}
            getStreak={store.getStreak}
          />
        </div>

        {/* Undo toast */}
        {store.undoEvent && (
          <UndoToast
            event={store.undoEvent}
            member={store.members.find(m => m.id === store.undoEvent!.memberId)}
            onUndo={store.undoLastEvent}
            onDismiss={store.dismissUndo}
          />
        )}

        {/* Member detail sheet */}
        {selectedMember && (
          <MemberDetail
            member={selectedMember}
            todayEvents={store.getEventsForDay(selectedMember.id, new Date())}
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
            members={store.members}
            getCountInRange={store.getCountInRange}
            getAllTimeCount={store.getAllTimeCount}
            getStreak={store.getStreak}
            getHeatmapData={store.getHeatmapData}
            onClose={() => setShowStats(false)}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
