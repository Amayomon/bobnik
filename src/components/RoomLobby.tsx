import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface RoomLobbyProps {
  onRoomJoined: (roomId: string) => void;
}

export function RoomLobby({ onRoomJoined }: RoomLobbyProps) {
  const { user, signOut } = useAuth();
  const [tab, setTab] = useState<'join' | 'create'>('join');
  const [code, setCode] = useState('');
  const [roomName, setRoomName] = useState('');
  const [memberName, setMemberName] = useState('');
  const [emoji, setEmoji] = useState('💩');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const emojis = ['💩', '🧢', '🍔', '🦊', '🌸', '🎮', '⚡', '🌶️', '🐱', '🦄'];

  // Check if user already has rooms
  const [existingRooms, setExistingRooms] = useState<{ id: string; name: string }[]>([]);
  const [checked, setChecked] = useState(false);

  useState(() => {
    if (!user) return;
    supabase
      .from('members')
      .select('room_id, rooms:room_id(id, name)')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const rooms = data
            .map((d: any) => d.rooms)
            .filter(Boolean);
          setExistingRooms(rooms);
        }
        setChecked(true);
      });
  });

  const joinRoom = async () => {
    if (!code.trim() || !memberName.trim()) {
      setError('Vyplň kód a jméno');
      return;
    }
    setLoading(true);
    setError('');

    // Look up room by code
    const { data: roomData, error: rpcError } = await supabase.rpc('get_room_by_code', { _code: code.trim().toLowerCase() });
    if (rpcError || !roomData || roomData.length === 0) {
      setError('Místnost s tímto kódem neexistuje');
      setLoading(false);
      return;
    }

    const roomId = roomData[0].id;

    // Add member
    const { error: memberError } = await supabase.from('members').insert({
      room_id: roomId,
      user_id: user!.id,
      name: memberName.trim(),
      emoji,
    });

    if (memberError) {
      if (memberError.message.includes('duplicate')) {
        // Already a member, just navigate
        onRoomJoined(roomId);
      } else {
        setError(memberError.message);
      }
      setLoading(false);
      return;
    }

    onRoomJoined(roomId);
    setLoading(false);
  };

  const createRoom = async () => {
    if (!roomName.trim() || !memberName.trim()) {
      setError('Vyplň název místnosti a jméno');
      return;
    }
    setLoading(true);
    setError('');

    // Create room
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .insert({ name: roomName.trim(), created_by: user!.id })
      .select()
      .single();

    if (roomError || !room) {
      setError(roomError?.message ?? 'Chyba při vytváření místnosti');
      setLoading(false);
      return;
    }

    // Add creator as member
    const { error: memberError } = await supabase.from('members').insert({
      room_id: room.id,
      user_id: user!.id,
      name: memberName.trim(),
      emoji,
    });

    if (memberError) {
      setError(memberError.message);
      setLoading(false);
      return;
    }

    onRoomJoined(room.id);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-5">
          <span className="text-5xl block mb-2">💩</span>
          <h1 className="text-2xl font-extrabold text-foreground">Bobník Tracker</h1>
          <p className="text-sm text-muted-foreground mt-1">Připoj se k místnosti nebo vytvoř novou</p>
        </div>

        {/* Existing rooms */}
        {existingRooms.length > 0 && (
          <div className="bg-card rounded-2xl p-4 shadow-md mb-3 space-y-2">
            <h3 className="text-xs font-bold text-muted-foreground uppercase">Tvoje místnosti</h3>
            {existingRooms.map(room => (
              <button
                key={room.id}
                onClick={() => onRoomJoined(room.id)}
                className="w-full text-left px-3 py-2.5 rounded-lg bg-muted hover:bg-row-hover text-sm font-semibold text-foreground transition-colors"
              >
                🏠 {room.name}
              </button>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-lg p-1 mb-3">
          <button
            onClick={() => setTab('join')}
            className={`flex-1 text-xs font-semibold py-2 rounded-md transition-colors ${
              tab === 'join' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
            }`}
          >
            Připojit se
          </button>
          <button
            onClick={() => setTab('create')}
            className={`flex-1 text-xs font-semibold py-2 rounded-md transition-colors ${
              tab === 'create' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
            }`}
          >
            Vytvořit místnost
          </button>
        </div>

        <div className="bg-card rounded-2xl p-5 shadow-md space-y-3">
          {tab === 'join' && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Kód místnosti</label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="abc123"
                maxLength={6}
                className="w-full px-3 py-2 rounded-lg bg-muted text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30 tracking-widest text-center font-mono text-lg"
              />
            </div>
          )}

          {tab === 'create' && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Název místnosti</label>
              <input
                type="text"
                value={roomName}
                onChange={e => setRoomName(e.target.value)}
                placeholder="Bobníci 💪"
                className="w-full px-3 py-2 rounded-lg bg-muted text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Tvoje jméno</label>
            <input
              type="text"
              value={memberName}
              onChange={e => setMemberName(e.target.value)}
              placeholder="Tomáš"
              className="w-full px-3 py-2 rounded-lg bg-muted text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Emoji</label>
            <div className="flex flex-wrap gap-2">
              {emojis.map(e => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`text-2xl p-1.5 rounded-lg transition-colors ${
                    emoji === e ? 'bg-primary/20 ring-2 ring-primary' : 'hover:bg-muted'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <button
            onClick={tab === 'join' ? joinRoom : createRoom}
            disabled={loading}
            className="w-full py-2.5 rounded-lg header-gradient text-primary-foreground font-bold text-sm disabled:opacity-60"
          >
            {loading ? '...' : tab === 'join' ? 'Připojit se' : 'Vytvořit'}
          </button>
        </div>

        <button
          onClick={signOut}
          className="w-full mt-3 text-xs text-muted-foreground text-center py-2"
        >
          Odhlásit se
        </button>
      </div>
    </div>
  );
}
