import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event from the URL hash
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
      }
    });

    // Also check if we already have a session (user clicked link and was auto-logged in)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Check URL hash for recovery type
        const hash = window.location.hash;
        if (hash.includes('type=recovery')) {
          setReady(true);
        }
      }
    });

    // Fallback: if after 3s no recovery event, mark as invalid
    const timeout = setTimeout(() => {
      setReady((prev) => {
        if (!prev) setInvalidLink(true);
        return prev;
      });
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Heslo musí mít alespoň 8 znaků.');
      return;
    }
    if (password !== confirm) {
      setError('Hesla se neshodují.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  if (invalidLink && !ready) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-card rounded-2xl p-5 shadow-md text-center">
          <span className="text-4xl mb-3 block">⚠️</span>
          <h2 className="text-lg font-bold text-foreground mb-2">Odkaz už není platný</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Tento odkaz pro obnovení hesla je neplatný nebo vypršel. Požádejte o nový.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 rounded-lg header-gradient text-primary-foreground font-bold text-sm"
          >
            Zpět na přihlášení
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-card rounded-2xl p-5 shadow-md text-center">
          <span className="text-4xl mb-3 block">✅</span>
          <h2 className="text-lg font-bold text-foreground mb-2">Heslo bylo úspěšně změněno</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Nyní se můžete přihlásit s novým heslem.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 rounded-lg header-gradient text-primary-foreground font-bold text-sm"
          >
            Přejít na přihlášení
          </button>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <p className="text-sm text-muted-foreground">Ověřuji odkaz…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-5">
          <span className="text-4xl block mb-2">🔑</span>
          <h1 className="text-xl font-extrabold text-foreground">Nastavit nové heslo</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-5 shadow-md space-y-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Nové heslo</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              className="w-full px-3 py-3 rounded-lg bg-muted text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Potvrzení nového hesla</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              className="w-full px-3 py-3 rounded-lg bg-muted text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg header-gradient text-primary-foreground font-bold text-sm disabled:opacity-60"
          >
            {loading ? '...' : 'Uložit nové heslo'}
          </button>
        </form>
      </div>
    </div>
  );
}
