import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts';

interface BobnikEvent {
  id: string;
  member_id: string;
  created_at: string;
  consistency: number;
  smell: number;
  size: number;
  effort: number;
  notary_present: boolean;
  special_type: string | null;
  neptunes_touch: boolean;
  phantom_cone: boolean;
}

interface Member {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

interface ProfileScreenProps {
  member: Member;
  events: BobnikEvent[];
  streak: number;
  onClose: () => void;
  onProfileUpdated: () => void;
}

function getStartOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

const EMOJI_OPTIONS = ['💩', '🐻', '🦊', '🐸', '🐶', '🐱', '🐰', '🦁', '🐼', '🐧', '🦄', '🐙'];

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-card rounded-lg p-3 text-center">
      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="text-lg font-bold text-foreground mt-0.5">{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

export function ProfileScreen({ member, events, streak, onClose, onProfileUpdated }: ProfileScreenProps) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(member.name);
  const [editEmoji, setEditEmoji] = useState(member.emoji);
  const [saving, setSaving] = useState(false);

  const myEvents = useMemo(() => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30); cutoff.setHours(0, 0, 0, 0);
    return events.filter(e => e.member_id === member.id && new Date(e.created_at) >= cutoff);
  }, [events, member.id]);

  const stats = useMemo(() => {
    const total = myEvents.length;
    const avgPerDay = (total / 30).toFixed(1);

    // Best day
    const dayCounts: Record<string, number> = {};
    myEvents.forEach(e => {
      const key = format(new Date(e.created_at), 'yyyy-MM-dd');
      dayCounts[key] = (dayCounts[key] || 0) + 1;
    });
    const bestDay = Math.max(0, ...Object.values(dayCounts));

    const notaryCount = myEvents.filter(e => e.notary_present).length;
    const notaryRate = total > 0 ? Math.round((notaryCount / total) * 100) : 0;

    const angelicCount = myEvents.filter(e => e.special_type === 'angelic').length;
    const demonicCount = myEvents.filter(e => e.special_type === 'demonic').length;
    const specialTotal = angelicCount + demonicCount;
    const specialRate = total > 0 ? Math.round((specialTotal / total) * 100) : 0;

    const neptunesCount = myEvents.filter(e => e.neptunes_touch).length;
    const neptunesPct = total > 0 ? Math.round((neptunesCount / total) * 100) : 0;
    const phantomCount = myEvents.filter(e => e.phantom_cone).length;
    const phantomPct = total > 0 ? Math.round((phantomCount / total) * 100) : 0;

    // Last special event
    const allMyEvents = events.filter(e => e.member_id === member.id && e.special_type);
    const lastSpecial = allMyEvents.length > 0
      ? new Date(allMyEvents.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at)
      : null;

    return { total, avgPerDay, bestDay, notaryRate, angelicCount, demonicCount, specialRate, lastSpecial, neptunesCount, neptunesPct, phantomCount, phantomPct };
  }, [myEvents, events, member.id]);

  // Daily chart (30 days)
  const dailyChart = useMemo(() => {
    const data: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const start = getStartOfDay(d);
      const end = new Date(start); end.setDate(end.getDate() + 1);
      const count = myEvents.filter(e => {
        const t = new Date(e.created_at);
        return t >= start && t < end;
      }).length;
      data.push({ date: format(start, 'd.M.', { locale: cs }), count });
    }
    return data;
  }, [myEvents]);

  // Attribute averages
  const attrAvg = useMemo(() => {
    if (myEvents.length === 0) return [
      { attr: 'Konzistence', avg: 0 }, { attr: 'Zápach', avg: 0 },
      { attr: 'Velikost', avg: 0 }, { attr: 'Úsilí', avg: 0 },
    ];
    const avg = (key: 'consistency' | 'smell' | 'size' | 'effort') => {
      const sum = myEvents.reduce((s, e) => s + e[key], 0);
      return parseFloat((sum / myEvents.length).toFixed(2));
    };
    return [
      { attr: 'Konzistence', avg: avg('consistency') },
      { attr: 'Zápach', avg: avg('smell') },
      { attr: 'Velikost', avg: avg('size') },
      { attr: 'Úsilí', avg: avg('effort') },
    ];
  }, [myEvents]);

  const handleSaveProfile = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from('members')
      .update({ name: editName.trim(), emoji: editEmoji })
      .eq('id', member.id);
    setSaving(false);
    if (!error) {
      toast('Profil uložen ✓', { duration: 2000 });
      setEditing(false);
      onProfileUpdated();
    } else {
      toast.error('Chyba při ukládání');
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-background overflow-y-auto">
      <div className="max-w-md mx-auto p-4 pb-20">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold text-foreground">Profil</h1>
          <button onClick={onClose} className="text-muted-foreground text-xl p-1">✕</button>
        </div>

        {/* Avatar & name */}
        <div className="bg-card rounded-xl p-4 mb-4">
          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Emoji</label>
                <div className="flex gap-1.5 flex-wrap">
                  {EMOJI_OPTIONS.map(em => (
                    <button
                      key={em}
                      onClick={() => setEditEmoji(em)}
                      className={`text-2xl p-1.5 rounded-lg transition-colors ${
                        editEmoji === em ? 'bg-primary/20 ring-2 ring-primary' : 'hover:bg-muted'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Jméno</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
                  maxLength={20}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveProfile}
                  disabled={saving || !editName.trim()}
                  className="flex-1 bg-primary text-primary-foreground text-sm font-semibold py-2 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {saving ? 'Ukládám…' : 'Uložit'}
                </button>
                <button
                  onClick={() => { setEditing(false); setEditName(member.name); setEditEmoji(member.emoji); }}
                  className="flex-1 bg-muted text-muted-foreground text-sm font-semibold py-2 rounded-xl hover:bg-muted/80 transition-colors"
                >
                  Zrušit
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-4xl">{member.emoji}</span>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-foreground">{member.name}</h2>
                <p className="text-xs text-muted-foreground">Člen místnosti</p>
              </div>
              <button
                onClick={() => setEditing(true)}
                className="text-xs bg-muted text-muted-foreground px-3 py-1.5 rounded-lg font-medium hover:bg-muted/80 transition-colors"
              >
                Upravit
              </button>
            </div>
          )}
        </div>

        {/* Stats cards */}
        <h2 className="text-sm font-bold text-muted-foreground mb-2 uppercase tracking-wide">Moje statistiky (30d)</h2>
        <div className="grid grid-cols-2 gap-2 mb-5">
          <StatCard label="Celkem" value={stats.total} />
          <StatCard label="Ø / den" value={stats.avgPerDay} />
          <StatCard label="Nejlepší den" value={stats.bestDay} />
          <StatCard label="Streak" value={`🔥 ${streak}`} sub="dní v kuse" />
          <StatCard label="Notář" value={`${stats.notaryRate}%`} sub="za 30 dní" />
          <StatCard label="✨ Andělské" value={stats.angelicCount} sub="za 30 dní" />
          <StatCard label="🔥 Ďábelské" value={stats.demonicCount} sub="za 30 dní" />
          <StatCard label="Speciální %" value={`${stats.specialRate}%`} sub={stats.lastSpecial ? `Poslední: ${format(stats.lastSpecial, 'd.M.', { locale: cs })}` : 'Zatím žádné'} />
          <StatCard label="🌊 Neptune" value={`${stats.neptunesCount} (${stats.neptunesPct}%)`} sub="za 30 dní" />
          <StatCard label="👻 Phantom" value={`${stats.phantomCount} (${stats.phantomPct}%)`} sub="za 30 dní" />
        </div>

        {/* Personal daily chart */}
        <div className="mb-5">
          <h2 className="text-sm font-bold text-muted-foreground mb-2 uppercase tracking-wide">Denní počet (30d)</h2>
          <div className="bg-card rounded-lg p-3">
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={dailyChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={24} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attribute averages */}
        <div className="mb-5">
          <h2 className="text-sm font-bold text-muted-foreground mb-2 uppercase tracking-wide">Průměr atributů (30d)</h2>
          <div className="bg-card rounded-lg p-3">
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={attrAvg} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" domain={[-3, 3]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis dataKey="attr" type="category" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={70} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="avg" radius={[0, 4, 4, 0]}>
                  {attrAvg.map((entry, i) => (
                    <Cell key={i} fill={entry.avg >= 0 ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
