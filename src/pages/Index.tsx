import { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { AuthPage } from '@/components/AuthPage';
import { RoomLobby } from '@/components/RoomLobby';
import { RoomView } from '@/components/RoomView';

const ROOM_KEY = 'activeRoomId';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(() => {
    return localStorage.getItem(ROOM_KEY);
  });

  // Persist room ID
  useEffect(() => {
    if (currentRoomId) {
      localStorage.setItem(ROOM_KEY, currentRoomId);
    } else {
      localStorage.removeItem(ROOM_KEY);
    }
  }, [currentRoomId]);

  // Clear room on sign out
  useEffect(() => {
    if (!loading && !user) {
      setCurrentRoomId(null);
    }
  }, [user, loading]);

  const handleLeave = useCallback(() => {
    setCurrentRoomId(null);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="text-4xl animate-bounce">💩</span>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  if (!currentRoomId) {
    return <RoomLobby onRoomJoined={setCurrentRoomId} />;
  }

  return <RoomView roomId={currentRoomId} onLeave={handleLeave} />;
}

const Index = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default Index;
