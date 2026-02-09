import { useState } from 'react';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { AuthPage } from '@/components/AuthPage';
import { RoomLobby } from '@/components/RoomLobby';
import { RoomView } from '@/components/RoomView';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);

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

  return <RoomView roomId={currentRoomId} onLeave={() => setCurrentRoomId(null)} />;
}

const Index = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default Index;
